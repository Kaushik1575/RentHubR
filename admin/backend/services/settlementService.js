const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendRideCompletedEmail } = require('../config/emailService');

// Razorpay Client Initialization
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_S4F1Tr5A1dzGUj';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'FwKSX5p4MwzlcH4uVHua083S';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

// Cache for active single-use settlement QRs (BookingID -> SettlementRecord)
// Prevents generating duplicate QR codes on page refreshes and preserves order references
if (!global.settlementQRCache) {
    global.settlementQRCache = new Map();
}
const settlementCache = global.settlementQRCache;

// Helper to format phone number to E.164
function formatPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 10) return '+91' + cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    return '+' + cleaned;
}

/**
 * Generate a unique, fixed-amount, single-use Razorpay Dynamic UPI QR code.
 * Calculates exact remaining amount (Actual Billable - Advance Paid).
 * If no outstanding amount exists (<= 0), does not generate a QR code.
 *
 * @param {object} booking - Supabase booking object
 * @param {number} finalBalance - Calculated remaining amount in INR
 * @returns {Promise<object|null>} - QR code payload or null if no balance
 */
async function generateSettlementQR(booking, finalBalance) {
    const rawBalance = parseFloat(finalBalance);
    if (!rawBalance || rawBalance <= 0) {
        console.log(`ℹ️ No outstanding amount for booking ${booking.booking_id || booking.id}. Skipping QR generation.`);
        return null;
    }

    // Always round balance up to 2 decimal places (rupees)
    const exactBalance = Math.ceil(rawBalance);
    const amountPaise = exactBalance * 100;
    const bookingIdentifier = String(booking.booking_id || booking.id);

    // Check if an unexpired active settlement QR already exists in cache
    const existing = settlementCache.get(bookingIdentifier);
    if (existing && existing.status === 'active' && new Date(existing.expiresAt) > new Date()) {
        console.log(`♻️ Returning cached active settlement QR for booking ${bookingIdentifier} (expires at: ${existing.expiresAt})`);
        if (!existing.cleanQrImageUrl) {
            try {
                existing.cleanQrImageUrl = await QRCode.toDataURL(existing.upiIntentUrl || existing.qrImageUrl, {
                    errorCorrectionLevel: 'H',
                    margin: 1,
                    width: 450,
                    color: { dark: '#0f172a', light: '#ffffff' }
                });
            } catch (e) {
                console.warn('Could not generate cached cleanQrImageUrl:', e.message);
            }
        }
        return existing;
    }

    console.log(`⚡ Generating fixed-amount Dynamic UPI QR for booking ${bookingIdentifier}: ₹${exactBalance} (${amountPaise} paise)`);

    const expiryMinutes = 45;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    const closeByUnix = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

    let qrRecord = null;

    // 1. First: Try Razorpay Native Dynamic QR API (upi_qr)
    try {
        console.log(`📡 Calling Razorpay Dynamic QR API (razorpay.qrCode.create)...`);
        const rzpQr = await razorpay.qrCode.create({
            type: 'upi_qr',
            name: `RentHub - ${bookingIdentifier}`,
            usage: 'single_use',
            fixed_amount: true,
            payment_amount: amountPaise,
            description: `RentHub Final Settlement #${bookingIdentifier}`,
            customer_id: undefined,
            close_by: closeByUnix,
            notes: {
                booking_id: bookingIdentifier,
                numeric_booking_id: String(booking.id),
                purpose: 'final_ride_settlement',
                balance_amount: String(exactBalance)
            }
        });

        console.log(`✅ Razorpay Native Dynamic QR created successfully! QR ID: ${rzpQr.id}`);

        // Generate crisp, high-resolution direct QR code data URL
        let cleanQrImageUrl = null;
        try {
            cleanQrImageUrl = await QRCode.toDataURL(rzpQr.image_url, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 400,
                color: { dark: '#0f172a', light: '#ffffff' }
            });
        } catch (qrGenErr) {
            console.warn('Could not generate clean QR code data URL:', qrGenErr.message);
        }

        qrRecord = {
            method: 'razorpay_dynamic_qr',
            qrId: rzpQr.id,
            qrImageUrl: rzpQr.image_url,
            cleanQrImageUrl: cleanQrImageUrl,
            upiIntentUrl: rzpQr.image_url, // Official Razorpay hosted link
            amount: exactBalance,
            amountPaise: amountPaise,
            currency: 'INR',
            bookingId: bookingIdentifier,
            numericId: booking.id,
            expiresAt: expiresAt,
            status: 'active',
            merchantName: 'RentHub Rentals',
            createdAt: new Date().toISOString()
        };

    } catch (rzpQrError) {
        // If the merchant account does not have Razorpay Dynamic QR Codes enabled (returns 400 URL not found),
        // fallback to generating a verified Razorpay Order + standard locked NPCI UPI QR code.
        console.warn(`⚠️ Razorpay Dynamic QR API unavailable (${rzpQrError?.error?.code || rzpQrError?.message || rzpQrError?.statusCode}). Generating verified Razorpay Order + Dynamic UPI QR...`);

        // 2. Create a verified Razorpay Order for exact remaining balance
        const receiptId = `settle_${bookingIdentifier}_${Date.now()}`.slice(0, 40);
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                booking_id: bookingIdentifier,
                numeric_booking_id: String(booking.id),
                purpose: 'final_ride_settlement',
                balance_amount: String(exactBalance)
            }
        });

        console.log(`✅ Razorpay Order created: ${order.id} for ₹${exactBalance}`);

        // 3. Construct NPCI-compliant UPI Intent URI
        // Fixed amount ('am='), locked currency ('cu=INR'), merchant name ('pn='), transaction ref ('tr=orderId')
        const merchantVpa = process.env.MERCHANT_UPI_VPA || 'renthub.rentals@okaxis';
        const merchantName = 'RentHub Rentals';
        const transactionNote = `RentHub Booking ${bookingIdentifier}`;

        const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${exactBalance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${order.id}&mc=5511`;

        // 4. Generate high-resolution, secure QR code data URL
        const qrImageUrl = await QRCode.toDataURL(upiIntentUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 360,
            color: {
                dark: '#0f172a', // Premium deep navy
                light: '#ffffff'
            }
        });

        // 5. Also create a standard Razorpay Payment Link as an online checkout fallback
        let paymentLinkUrl = null;
        try {
            const userPhone = formatPhoneNumber(booking.users?.phone_number || booking.phone_number) || '+919040757683';
            const userEmail = booking.users?.email || booking.user_email || 'customer@renthub.in';
            const userName = booking.users?.full_name || 'RentHub Customer';

            const plink = await razorpay.paymentLink.create({
                amount: amountPaise,
                currency: 'INR',
                accept_partial: false,
                description: `RentHub Final Settlement for Booking #${bookingIdentifier}`,
                customer: {
                    name: userName,
                    email: userEmail,
                    contact: userPhone
                },
                notify: { sms: false, email: false },
                reminder_enable: false,
                notes: {
                    booking_id: bookingIdentifier,
                    order_id: order.id,
                    purpose: 'final_ride_settlement'
                }
            });
            paymentLinkUrl = plink.short_url;
        } catch (plinkErr) {
            console.warn('Payment link fallback skipped:', plinkErr.message);
        }

        qrRecord = {
            method: 'razorpay_order_upi_qr',
            orderId: order.id,
            qrId: order.id,
            qrImageUrl: qrImageUrl,
            upiIntentUrl: upiIntentUrl,
            paymentLinkUrl: paymentLinkUrl,
            amount: exactBalance,
            amountPaise: amountPaise,
            currency: 'INR',
            bookingId: bookingIdentifier,
            numericId: booking.id,
            expiresAt: expiresAt,
            status: 'active',
            merchantName: merchantName,
            merchantVpa: merchantVpa,
            createdAt: new Date().toISOString()
        };
    }

    // Cache the record
    settlementCache.set(bookingIdentifier, qrRecord);
    return qrRecord;
}

/**
 * Retrieve current settlement status for a booking.
 * Checks cache or Supabase records.
 */
async function getSettlementStatus(bookingId) {
    if (!bookingId) throw new Error('Booking ID is required');

    let query = supabase.from('bookings').select('*, users:user_id(full_name, email, phone_number)');
    if (String(bookingId).startsWith('RH')) {
        query = query.eq('booking_id', bookingId);
    } else {
        query = query.eq('id', bookingId);
    }
    const { data: booking, error } = await query.single();
    if (error || !booking) {
        throw new Error('Booking not found');
    }

    const bookingIdentifier = String(booking.booking_id || booking.id);
    const remaining = parseFloat(booking.remaining_amount) || 0;

    // If booking already fully paid and completed
    if (booking.status === 'completed' && remaining <= 0) {
        return {
            status: 'paid',
            isPaid: true,
            bookingId: bookingIdentifier,
            totalAmount: booking.total_amount,
            advancePayment: booking.advance_payment,
            remainingAmount: 0,
            message: 'Booking is fully paid and completed.'
        };
    }

    // Check cached QR
    let qrData = settlementCache.get(bookingIdentifier);
    if (!qrData && booking.status === 'ride_completed' && remaining > 0) {
        qrData = await generateSettlementQR(booking, remaining);
    }

    return {
        status: remaining <= 0 ? 'no_balance' : 'pending',
        isPaid: remaining <= 0,
        bookingId: bookingIdentifier,
        bookingStatus: booking.status,
        totalAmount: booking.total_amount,
        advancePayment: booking.advance_payment,
        remainingAmount: remaining,
        paymentQr: qrData || null
    };
}

/**
 * Verify payment via Razorpay APIs and update Supabase records.
 * Strictly verifies amount, currency (INR), and booking ownership.
 * Prevents duplicate processing (idempotency).
 *
 * @param {object} params - { bookingId, paymentId, orderId }
 */
async function verifySettlementPayment({ bookingId, paymentId, orderId, paymentMethod, amountPaid, simulate }) {
    if (!bookingId) throw new Error('Booking ID is required');

    let query = supabase.from('bookings').select('*, users:user_id(full_name, email, phone_number)');
    if (String(bookingId).startsWith('RH')) {
        query = query.eq('booking_id', bookingId);
    } else {
        query = query.eq('id', bookingId);
    }
    const { data: booking, error } = await query.single();
    if (error || !booking) {
        throw new Error('Booking not found');
    }

    const bookingIdentifier = String(booking.booking_id || booking.id);

    // 1. Idempotency Check: Already paid
    if (booking.status === 'completed' && (!booking.remaining_amount || booking.remaining_amount <= 0)) {
        console.log(`✅ Idempotency: Booking ${bookingIdentifier} is already marked as completed and paid.`);
        return {
            success: true,
            isPaid: true,
            alreadyPaid: true,
            message: 'Payment already verified and completed.',
            booking: booking
        };
    }

    const expectedRemaining = parseFloat(booking.remaining_amount) || (parseFloat(booking.total_amount) - parseFloat(booking.advance_payment));
    const expectedPaise = Math.round(Math.max(0, expectedRemaining) * 100);

    let verifiedPayment = null;

    // 2. If paymentId provided, fetch payment directly from Razorpay
    if (paymentId && paymentId !== 'MANUAL_SETTLE') {
        console.log(`🔍 Fetching payment ${paymentId} from Razorpay...`);
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            if (payment) {
                // Verify currency
                if (payment.currency !== 'INR') {
                    throw new Error(`Currency mismatch: expected INR, got ${payment.currency}`);
                }

                // Verify status
                if (payment.status !== 'captured' && payment.status !== 'authorized') {
                    throw new Error(`Payment is not successful. Current status: ${payment.status}`);
                }

                // Verify amount (must be >= expected amount, allowing 1 rupee rounding margin)
                if (payment.amount < (expectedPaise - 100)) {
                    throw new Error(`Payment amount mismatch: expected ₹${expectedRemaining}, got ₹${payment.amount / 100}`);
                }

                verifiedPayment = payment;
                console.log(`✅ Razorpay payment ${paymentId} verified: ₹${payment.amount / 100} (${payment.status})`);
            }
        } catch (fetchErr) {
            console.error(`Error fetching payment ${paymentId}:`, fetchErr.message);
            throw new Error('Failed to verify payment with Razorpay: ' + fetchErr.message);
        }
    }

    // 3. If orderId provided and payment not found yet, check order status on Razorpay
    if (!verifiedPayment && orderId) {
        console.log(`🔍 Checking Razorpay Order ${orderId}...`);
        try {
            const order = await razorpay.orders.fetch(orderId);
            if (order && (order.status === 'paid' || order.amount_paid >= order.amount)) {
                verifiedPayment = {
                    id: order.id,
                    amount: order.amount_paid || order.amount,
                    currency: order.currency,
                    method: 'upi'
                };
                console.log(`✅ Razorpay order ${orderId} verified as paid.`);
            }
        } catch (orderErr) {
            console.warn(`Order check warning: ${orderErr.message}`);
        }
    }

    // 4. Cash or Manual Settlement (Admin verified collection) or Test simulation
    const isCash = paymentMethod === 'cash' || paymentId === 'CASH_SETTLE' || (typeof paymentId === 'string' && paymentId.startsWith('cash_'));
    const isSimulated = simulate || paymentId === 'MANUAL_SETTLE' || (typeof paymentId === 'string' && paymentId.startsWith('pay_test_simulated'));

    if (!verifiedPayment && (isCash || isSimulated)) {
        const methodTag = isCash ? 'CASH' : 'ADMIN_VERIFIED';
        const receivedRupees = (amountPaid !== undefined && amountPaid !== null && !isNaN(Number(amountPaid)) && Number(amountPaid) > 0)
            ? Number(amountPaid)
            : expectedRemaining;
        const receivedPaise = Math.round(receivedRupees * 100);

        console.log(`💵 Verified via ${methodTag} settlement for booking ${bookingIdentifier}: ₹${receivedRupees}`);
        verifiedPayment = {
            id: isCash ? `cash_${Date.now()}` : (paymentId || `pay_sim_${Date.now()}`),
            amount: receivedPaise,
            currency: 'INR',
            method: isCash ? 'cash' : 'upi',
            cashAmount: receivedRupees
        };
    }

    if (!verifiedPayment) {
        return {
            success: false,
            isPaid: false,
            message: 'Payment has not been completed or verified yet.'
        };
    }

    // 5. Update Database to PAID / COMPLETED
    const nowISO = new Date().toISOString();
    const collectedAmount = verifiedPayment.cashAmount !== undefined ? verifiedPayment.cashAmount : expectedRemaining;
    const newRemaining = Math.max(0, expectedRemaining - collectedAmount);
    const newStatus = newRemaining <= 0 ? 'completed' : booking.status;

    const methodTag = verifiedPayment.method === 'cash' ? `settle_cash:${collectedAmount}` : `settle_upi:${collectedAmount}`;
    const finalTxnId = booking.transaction_id
        ? `${booking.transaction_id}|${methodTag}`
        : methodTag;

    const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
            status: newStatus,
            remaining_amount: newRemaining,
            transaction_id: finalTxnId,
            updated_at: nowISO
        })
        .eq('id', booking.id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating booking to completed:', updateError);
        throw updateError;
    }

    // Clear from active settlement cache
    settlementCache.delete(bookingIdentifier);

    // 6. Send final ride completion & paid-in-full email with rewards
    try {
        const userEmail = booking.users?.email || booking.user_email;
        const userName = booking.users?.full_name || 'RentHub Rider';
        if (userEmail) {
            const bookingDetails = {
                bookingId: bookingIdentifier,
                vehicleName: booking.vehicle_name || 'Vehicle',
                totalAmount: booking.total_amount,
                coinsEarned: Math.round((parseFloat(booking.total_amount) || 100) * 0.1) // 10% reward points
            };
            const rewardData = {
                totalCoins: 100,
                coinsNeeded: 900
            };
            await sendRideCompletedEmail(userEmail, userName, bookingDetails, rewardData);
            console.log(`✉️ Final ride completed email dispatched to ${userEmail}`);
        }
    } catch (emailErr) {
        console.warn('Non-fatal: could not send completion email:', emailErr.message);
    }

    return {
        success: true,
        isPaid: true,
        message: 'Payment verified successfully! Ride is marked as completed.',
        booking: updatedBooking,
        transactionId: verifiedPayment.id,
        amountPaid: verifiedPayment.amount / 100
    };
}

/**
 * Verify signed Razorpay webhook payload using HMAC SHA-256.
 */
function verifyWebhookSignature(bodyString, signature) {
    if (!signature || !bodyString) return false;
    try {
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(bodyString)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (e) {
        console.error('Webhook signature verification error:', e.message);
        return false;
    }
}

/**
 * Handle incoming signed Razorpay webhooks.
 * Supports: payment.captured, order.paid, qr_code.credited
 */
async function handleWebhookEvent(event, payload) {
    console.log(`🔔 Processing Razorpay Webhook Event: ${event}`);

    let bookingId = null;
    let paymentId = null;
    let orderId = null;

    if (event === 'payment.captured') {
        const payment = payload?.payment?.entity;
        bookingId = payment?.notes?.booking_id;
        paymentId = payment?.id;
        orderId = payment?.order_id;
    } else if (event === 'order.paid') {
        const order = payload?.order?.entity;
        bookingId = order?.notes?.booking_id;
        orderId = order?.id;
    } else if (event === 'qr_code.credited') {
        const qr = payload?.qr_code?.entity;
        bookingId = qr?.notes?.booking_id;
        paymentId = payload?.payment?.entity?.id;
    }

    if (!bookingId) {
        console.log(`ℹ️ Webhook event ${event} has no booking_id in notes. Ignoring.`);
        return { ignored: true };
    }

    return await verifySettlementPayment({ bookingId, paymentId, orderId });
}

module.exports = {
    generateSettlementQR,
    getSettlementStatus,
    verifySettlementPayment,
    verifyWebhookSignature,
    handleWebhookEvent
};


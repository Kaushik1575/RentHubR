const Razorpay = require('razorpay');
const settlementService = require('../services/settlementService');
const supabase = require('../config/supabase');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_S4F1Tr5A1dzGUj';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'FwKSX5p4MwzlcH4uVHua083S';

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        res.json({
            ...order,
            key_id: RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Error creating payment order', details: error.message || error });
    }
};

/**
 * Generate/Fetch fixed-amount dynamic UPI QR code for remaining balance
 * POST /api/payment/settlement-qr
 */
const getSettlementQR = async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Fetch booking from Supabase
        let query = supabase.from('bookings').select('*, users:user_id(full_name, email, phone_number)');
        if (String(bookingId).startsWith('RH')) {
            query = query.eq('booking_id', bookingId);
        } else {
            query = query.eq('id', bookingId);
        }
        const { data: booking, error } = await query.single();
        if (error || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // If booking already fully paid
        if (booking.status === 'completed' && (!booking.remaining_amount || booking.remaining_amount <= 0)) {
            return res.json({
                success: true,
                status: 'paid',
                isPaid: true,
                message: 'Ride has already been fully settled and paid.',
                paymentQr: null
            });
        }

        const remaining = parseFloat(booking.remaining_amount) || (parseFloat(booking.total_amount) - parseFloat(booking.advance_payment));
        if (remaining <= 0) {
            return res.json({
                success: true,
                status: 'no_balance',
                isPaid: true,
                message: 'No outstanding balance exists for this booking.',
                paymentQr: null
            });
        }

        // Generate or retrieve cached QR code
        const paymentQr = await settlementService.generateSettlementQR(booking, remaining);

        res.json({
            success: true,
            status: 'pending',
            isPaid: false,
            bookingId: booking.booking_id || booking.id,
            remainingAmount: remaining,
            paymentQr
        });

    } catch (error) {
        console.error('Error in getSettlementQR:', error);
        res.status(500).json({ error: 'Failed to generate settlement QR: ' + error.message });
    }
};

/**
 * Get settlement status for polling
 * GET /api/payment/settlement-status/:bookingId
 */
const getSettlementStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const result = await settlementService.getSettlementStatus(bookingId);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error getting settlement status:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify settlement payment via Razorpay
 * POST /api/payment/verify-settlement
 */
const verifySettlement = async (req, res) => {
    try {
        const { bookingId, paymentId, orderId, paymentMethod, simulate } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        const result = await settlementService.verifySettlementPayment({ bookingId, paymentId, orderId, paymentMethod, simulate });
        res.json(result);
    } catch (error) {
        console.error('Error verifying settlement payment:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * Webhook handler for Razorpay asynchronous events
 * POST /api/payment/razorpay-webhook
 */
const handleRazorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        // Verify signature
        const isValid = settlementService.verifyWebhookSignature(bodyString, signature);
        if (!isValid) {
            console.warn('⚠️ Invalid Razorpay webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const event = payload.event;

        const result = await settlementService.handleWebhookEvent(event, payload.payload);
        res.json({ status: 'ok', result });

    } catch (error) {
        console.error('Error processing Razorpay webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed: ' + error.message });
    }
};

module.exports = {
    createOrder,
    getSettlementQR,
    getSettlementStatus,
    verifySettlement,
    handleRazorpayWebhook
};

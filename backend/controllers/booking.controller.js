const dayjs = require('dayjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const SupabaseDB = require('../models/supabaseDB');
const { getISTTimestamp } = require('../utils/dateUtils');
const { generateInvoiceBuffer } = require('../utils/invoiceGenerator');
const { sendImmediateReminderIfNeeded } = require('../services/reminderService');
const { makeBookingConfirmationCall } = require('../config/retellCallService');
const { generateBookingId } = require('../utils/bookingIdGenerator');
const Razorpay = require('razorpay');

// Helpers
async function checkTimeConflict(vehicleId, startDate, startTime, duration) {
    try {
        const { data: existingBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .eq('start_date', startDate)
            .neq('status', 'cancelled')
            .neq('status', 'rejected');

        if (error) {
            console.error('Supabase error in checkTimeConflict:', error);
            throw error;
        }

        if (!Array.isArray(existingBookings)) {
            console.error('existingBookings is not an array:', existingBookings);
            return { conflict: false };
        }

        // Convert start time to minutes for easier comparison
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = startTimeMinutes + (duration * 60);
        // Add 1-hour buffer before and after
        const bufferStartTime = startTimeMinutes - 60;
        const bufferEndTime = endTimeMinutes + 60;
        for (const booking of existingBookings) {
            // Check if start_time exists
            if (!booking.start_time) continue;

            const [existingHour, existingMinute] = booking.start_time.split(':').map(Number);
            const existingStartTimeMinutes = existingHour * 60 + existingMinute;
            const existingEndTimeMinutes = existingStartTimeMinutes + (booking.duration * 60);

            // Calculate existing end time for the message
            const existingEndTotalMinutes = existingStartTimeMinutes + (booking.duration * 60);
            const existingEndHour = Math.floor(existingEndTotalMinutes / 60) % 24;
            const existingEndMinute = existingEndTotalMinutes % 60;
            const formattedEndTime = `${existingEndHour.toString().padStart(2, '0')}:${existingEndMinute.toString().padStart(2, '0')}`;

            // Check for overlap (including 1 hour buffer)
            if (existingStartTimeMinutes < bufferEndTime && existingEndTimeMinutes > bufferStartTime) {
                // Format the date in a readable format
                const bookingDate = new Date(booking.start_date);
                const formattedDate = bookingDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return {
                    conflict: true,
                    existingBooking: booking,
                    message: `This vehicle is already booked on ${formattedDate} from ${booking.start_time} to ${formattedEndTime}. Please try another vehicle or choose a different time slot. (Note: A 1-hour gap is required before and after each booking)`
                };
            }
        }
        return { conflict: false };
    } catch (error) {
        console.error('Error checking time conflict:', error);
        throw error;
    }
}

// Controller Methods

// Check availability
const checkAvailability = async (req, res) => {
    try {
        const { vehicleId, startDate, startTime, duration } = req.body;

        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid time format. Please use HH:mm format (24-hour)' });
        }

        // Convert startTime to 24-hour format if needed
        const [hours, minutes] = startTime.split(':').map(Number);
        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Validate that booking is not in the past
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentIso = istNow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const bookingIso = `${startDate}T${formattedStartTime}`;

        if (bookingIso < currentIso) {
            console.log(`❌ Rejected past booking attempt: ${bookingIso} < ${currentIso}`);
            return res.status(400).json({ error: 'Cannot book for a past date or time.' });
        }

        const conflict = await checkTimeConflict(vehicleId, startDate, formattedStartTime, duration);
        if (conflict.conflict) {
            return res.status(409).json(conflict);
        }

        res.status(200).json({ available: true, message: 'Vehicle is available' });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Error checking availability' });
    }
};

// Create booking
const createBooking = async (req, res) => {
    try {
        console.log('--- Booking Request Received ---');
        console.log('User:', req.user);
        console.log('Body:', req.body);
        const { vehicleId, startDate, startTime, duration, vehicleType, transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Verify Razorpay Payment if present
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
            const digest = shasum.digest('hex');

            if (digest !== razorpaySignature) {
                return res.status(400).json({ error: 'Payment verification failed! Invalid signature.' });
            }
            console.log('✅ Payment verified successfully');

            // Fetch actual payment amount from Razorpay
            try {
                const payment = await razorpay.payments.fetch(razorpayPaymentId);
                const actualAmountPaid = payment.amount / 100; // Convert paise to rupees
                console.log(`Razorpay payment fetched: ₹${actualAmountPaid}`);
                req.body.actualAdvancePayment = actualAmountPaid;
            } catch (fetchError) {
                console.error('Error fetching payment from Razorpay:', fetchError);
            }
        }
        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid time format. Please use HH:mm format (24-hour)' });
        }
        // Convert startTime to 24-hour format if needed
        const [hours, minutes] = startTime.split(':').map(Number);
        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        // Check for time conflicts
        const conflict = await checkTimeConflict(vehicleId, startDate, formattedStartTime, duration);
        if (conflict.conflict) {
            return res.status(409).json(conflict);
        }

        // Validate that booking is not in the past
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const bookingDateTime = new Date(`${startDate}T${formattedStartTime}:00`);

        const currentIso = istNow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const bookingIso = `${startDate}T${formattedStartTime}`;

        if (bookingIso < currentIso) {
            return res.status(400).json({ error: 'Cannot book for a past date or time.' });
        }
        // Use actual payment amount from Razorpay if available, otherwise use frontend value
        const totalAmount = req.body.totalAmount || 0;
        const advancePayment = req.body.actualAdvancePayment || Math.ceil(totalAmount * 0.3);

        // Generate professional Booking ID (format: RHYYMMDD-XXX)
        let bookingId;
        try {
            bookingId = await generateBookingId();
            console.log(`📋 Generated Booking ID: ${bookingId}`);
        } catch (idError) {
            console.error('❌ Failed to generate Booking ID:', idError);
            return res.status(500).json({ error: 'Failed to generate booking ID. Please try again.' });
        }

        const bookingData = {
            booking_id: bookingId,
            user_id: req.user.id,
            vehicle_id: vehicleId,
            start_date: startDate,
            start_time: formattedStartTime, // Use formatted time
            duration,
            status: 'confirmed', // Confirmed since payment is verified
            vehicle_type: vehicleType,
            transaction_id: req.body.razorpayPaymentId || 'PENDING',
            confirmation_timestamp: getISTTimestamp(), // Add confirmation timestamp in IST
            advance_payment: advancePayment, // 30% advance payment
            total_amount: totalAmount // Store total amount
        };
        console.log('Booking data to insert:', bookingData);
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            // Check for unique constraint violation
            if (error.code === '23505' && (error.details?.includes('transaction_id') || error.message?.includes('transaction_id'))) {
                return res.status(409).json({ error: 'Transaction ID already exists.' });
            }
            // Return actual DB error for debugging (remove in production if needed, but useful now)
            return res.status(500).json({ error: 'Error creating booking', details: error.message, code: error.code, hint: error.hint });
        }

        console.log('Booking created:', data);

        // Async Background Notification: Email & Call
        (async () => {
            try {
                // 1. Fetch User Details
                const { data: userDetails } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', req.user.id)
                    .single();

                if (!userDetails) {
                    console.error('User not found for notification.');
                    return;
                }

                // 2. Fetch Vehicle Details (Name, etc.)
                let vehicleName = `Vehicle ${vehicleId}`;
                try {
                    const { data: vehicleData } = await supabase
                        .from(vehicleType) // 'bikes', 'cars', etc.
                        .select('name')
                        .eq('id', vehicleId)
                        .single();
                    if (vehicleData) vehicleName = vehicleData.name;
                } catch (vError) {
                    console.log('Could not fetch vehicle name:', vError);
                }

                // 4. Send Rich Email with Invoice
                try {
                    // Generate PDF invoice buffer
                    const pdfBuffer = await generateInvoiceBuffer(
                        data.booking_id, // Professional Booking ID (e.g., RH251222-001)
                        userDetails.full_name, // userName
                        userDetails.email, // userEmail
                        vehicleName,
                        duration,
                        `${startDate} ${formattedStartTime}`,
                        req.body.totalAmount || 0,
                        req.body.advancePayment || 0
                    );

                    // Build Google Calendar link
                    const dayjs = require('dayjs');
                    const start = dayjs(`${startDate}T${formattedStartTime}`);
                    const end = start.add(duration, 'hour');
                    const formatForCal = (d) => {
                        const iso = (new Date(d)).toISOString();
                        return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
                    };
                    const gcalDates = `${formatForCal(start)}/${formatForCal(end)}`;
                    const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
                    const gcalText = encodeURIComponent(`RentHub booking ${data.booking_id} — ${vehicleName}`);
                    const gcalDetails = encodeURIComponent(`Booking ID: ${data.booking_id}\nVehicle: ${vehicleName}\nPickup: ${startDate} ${formattedStartTime}`);
                    const gcalUrl = `${gcalBase}&text=${gcalText}&dates=${gcalDates}&details=${gcalDetails}`;

                    // Construct Rich HTML Email
                    const mailHtml = `
                        <div style="font-family: Arial, sans-serif; color: #222;">
                          <h2 style="color:#0b5cff;">Hello ${userDetails.full_name},</h2>
                          <p>We are excited to let you know that your booking has been <b>confirmed</b> by the RentHub team. Please find your invoice attached.</p>
                          <h3>Booking Details</h3>
                          <table style="width:100%; border-collapse: collapse;">
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Booking ID</b></td><td style="padding:6px; border:1px solid #eee;">${data.booking_id}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #eee;">${vehicleName}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Pickup Date & Time</b></td><td style="padding:6px; border:1px solid #eee;">${startDate} ${formattedStartTime}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Duration</b></td><td style="padding:6px; border:1px solid #eee;">${duration} hours</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Total Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.totalAmount || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Advance Paid</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.advancePayment || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Remaining Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.remainingAmount || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Confirmation Time</b></td><td style="padding:6px; border:1px solid #eee;">${new Date().toLocaleString()}</td></tr>
                          </table>
                          <p style="margin-top:12px;">
                            <a href="${gcalUrl}" style="display:inline-block;padding:10px 14px;background:#0b5cff;color:#fff;border-radius:4px;text-decoration:none;">Add to Google Calendar</a>
                          </p>
                          <hr style="margin-top:18px;" />
                          <p style="font-size:12px;color:#666;"><b>Pickup Instructions:</b> Please bring a valid ID and a printed or digital copy of this invoice. If you have any questions, call us.</p>
                          <p style="font-size:12px;color:#666;">If you find this email in spam, please mark as <b>Not Spam</b> to ensure future delivery.</p>
                          <footer style="margin-top:18px;padding-top:8px;border-top:1px solid #eee;color:#999;font-size:12px;">
                            <div>RentHub — Bike & Vehicle Rentals</div>
                            <div>support@renthub.example | +91 90000 00000</div>
                            <div>123 RentHub Street, City, Country</div>
                          </footer>
                        </div>
                    `;

                    const mailOptions = {
                        to: userDetails.email,
                        subject: 'Booking Confirmed – RentHub',
                        html: mailHtml,
                        attachments: [
                            { filename: 'booking_invoice.pdf', content: pdfBuffer }
                        ]
                    };

                    const { sendEmail } = require('../config/emailService');
                    await sendEmail(mailOptions);
                    console.log(`📧 Rich confirmation email with PDF sent to ${userDetails.email}`);

                } catch (emailError) {
                    console.error('❌ Error generating invoice or sending email:', emailError);
                }

                // 5. Trigger Retell AI Call
                if (userDetails.phone_number) {
                    const detailsForCall = {
                        bookingId: data.booking_id,
                        vehicleName: vehicleName,
                        vehicleType: vehicleType,
                        startDate: startDate,
                        startTime: formattedStartTime,
                        duration: duration,
                        userName: userDetails.full_name
                    };
                    await makeBookingConfirmationCall(userDetails.phone_number, detailsForCall);
                    console.log(`📞 Confirmation call triggered for ${userDetails.phone_number}`);
                }

                // 6. Check if immediate reminder needed (for bookings within 2 hours)
                try {
                    // Wait 2 seconds to ensure confirmation email is sent first
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sendImmediateReminderIfNeeded(data.id);
                } catch (reminderError) {
                    console.error('❌ Error sending immediate reminder:', reminderError);
                }

            } catch (notifyError) {
                console.error('❌ Error in background notification task:', notifyError);
            }
        })();

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error creating booking', details: error.message || error });
    }
};

const getUserBookings = async (req, res) => {
    try {
        const bookings = await SupabaseDB.getBookingsByUser(req.user.id);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.user.id;
        console.log('Processing user booking cancellation for ID:', bookingId);

        // First, fetch the booking
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users:user_id(*)')
            .eq('id', bookingId)
            .eq('user_id', userId) // Ensure the booking belongs to the user
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({ error: 'Only confirmed bookings can be cancelled' });
        }

        // Calculate refund amount based on time since confirmation
        const now = new Date();
        const confirmationTime = booking.confirmation_timestamp ? new Date(booking.confirmation_timestamp) : now;
        const hoursSinceConfirmation = (now - confirmationTime) / (1000 * 60 * 60);

        console.log('Booking cancellation debug:', {
            confirmation_timestamp: booking.confirmation_timestamp,
            now: new Date().toISOString(),
            advance_payment: booking.advance_payment
        });

        let refundAmount = 0;
        // Calculate refund based on advance payment only
        const advancePayment = parseFloat(booking.advance_payment) || 100; // Default to 100 if not set
        if (hoursSinceConfirmation <= 2) {
            // Full refund of advance payment
            refundAmount = advancePayment;
        } else {
            // 70% refund of advance payment
            refundAmount = Math.round(advancePayment * 0.7);
        }

        console.log('hoursSinceConfirmation:', hoursSinceConfirmation);

        // Calculate deduction
        let deductionAmount = 0;
        if (hoursSinceConfirmation > 2) {
            deductionAmount = Math.round(advancePayment * 0.3);
        }
        // Use local time for cancelled_timestamp
        const nowCancel = new Date();
        const localCancelTimestamp = nowCancel.getFullYear() + '-' +
            String(nowCancel.getMonth() + 1).padStart(2, '0') + '-' +
            String(nowCancel.getDate()).padStart(2, '0') + ' ' +
            String(nowCancel.getHours()).padStart(2, '0') + ':' +
            String(nowCancel.getMinutes()).padStart(2, '0') + ':' +
            String(nowCancel.getSeconds()).padStart(2, '0');

        // Attempt Razorpay auto-refund if transaction_id exists and refund amount > 0
        let refundStatus = 'processing';
        let razorpayRefundId = null;

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        if (booking.transaction_id && refundAmount > 0) {
            try {
                console.log(`Initiating Razorpay refund (User Cancel) - booking ${bookingId}, payment ${booking.transaction_id}, amount: ₹${refundAmount} (in paise: ${refundAmount * 100})`);

                const refundResponse = await razorpay.payments.refund(booking.transaction_id, {
                    amount: refundAmount * 100, // Convert to paise
                    notes: {
                        booking_id: bookingId,
                        reason: 'Booking cancelled by user',
                        cancelled_at: localCancelTimestamp
                    }
                });

                console.log('✅ Razorpay refund SUCCESS (User Cancel):', JSON.stringify(refundResponse, null, 2));
                refundStatus = 'completed';
                razorpayRefundId = refundResponse.id;

            } catch (refundError) {
                console.error('❌ Razorpay refund FAILED (User Cancel):', refundError);
                if (refundError.error) {
                    console.error('Razorpay Error Details:', JSON.stringify(refundError.error, null, 2));
                }
                // Keep refund_status as 'processing' for manual intervention
                console.log('Refund will remain in processing status for manual handling');
            }
            // Keep refund_status as 'processing' for manual intervention
            console.log('Refund will remain in processing status for manual handling');
        } else if (refundAmount === 0) {

            refundStatus = 'not_applicable';
        }

        // Update booking status to cancelled with refund details, timestamps, and deduction
        const updateData = {
            status: 'cancelled',
            refund_amount: refundAmount,
            refund_status: refundStatus,
            cancelled_timestamp: localCancelTimestamp,
            refund_deduction: deductionAmount
        };

        // Only add these fields if they have values
        if (razorpayRefundId) {
            updateData.refund_id = razorpayRefundId;
            updateData.refund_timestamp = localCancelTimestamp;
            updateData.refund_details = { method: 'auto_razorpay', refund_id: razorpayRefundId };
        }

        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select('*, users:user_id(*)')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // Update vehicle availability back to true
        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';

            const { error: vehicleError } = await supabase
                .from(vehicleTable)
                .update({ is_available: true })
                .eq('id', booking.vehicle_id);

            if (vehicleError) {
                console.error('Error updating vehicle:', vehicleError);
            }
        }

        console.log('Booking cancelled successfully:', updatedBooking);

        res.json({
            message: 'Booking cancelled successfully',
            refundAmount,
            deduction: deductionAmount,
            refundStatus,
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            error: 'Error cancelling booking',
            details: error.message
        });
    }
};

const submitRefundDetails = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.user.id;

        // Fetch the booking
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Fetch error in refund-details endpoint:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }
        if (booking.status !== 'rejected') {
            return res.status(400).json({ error: 'Refund details can only be submitted for rejected bookings' });
        }
        if (!req.body || !req.body.refundDetails) {
            return res.status(400).json({ error: 'Missing refund details' });
        }

        // Set refund_amount and refundAmount to full advance payment (default 100 if not set)
        const advancePayment = booking.advance_payment || booking.advancePayment || 100;

        // Update the booking with refund details, refund amount, and set refund_status to 'processing'
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                refund_details: req.body.refundDetails,
                refund_amount: advancePayment,
                refund_status: 'processing',
                refund_deduction: 0 // Set deduction to 0 for rejected refunds
            })
            .eq('id', bookingId)
            .select('*')
            .single();

        if (updateError) {
            console.error('Update error in refund-details endpoint:', updateError);
            return res.status(500).json({ error: 'Error updating refund details' });
        }

        res.json({ message: 'Refund details submitted successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Catch error in refund-details endpoint:', error);
        res.status(500).json({ error: 'Error submitting refund details', details: error.message });
    }
};

module.exports = {
    checkAvailability,
    createBooking,
    getUserBookings,
    cancelBooking,
    submitRefundDetails
};

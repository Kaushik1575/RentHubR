const supabase = require('../config/supabase');
const SupabaseDB = require('../models/supabaseDB');
const { getISTTimestamp } = require('../utils/dateUtils');
const { generateInvoiceBuffer } = require('../utils/invoiceGenerator');
const { sendEmail, sendRefundCompleteEmail, sendSOSLinkEmail } = require('../config/emailService');
const { makeBookingConfirmationCall } = require('../config/retellCallService');
const { sendImmediateReminderIfNeeded, checkAndSendReminders } = require('../services/reminderService');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const ADMIN_EMAILS = ['jyoti2006@gmail.com']; // Replace with env or config if needed

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Admin: Get all bookings (enriched)
const getAllBookings = async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `)
            .order('id', { ascending: false });

        if (error) throw error;

        // Get all vehicles
        const { data: bikes } = await supabase.from('bikes').select('*');
        const { data: cars } = await supabase.from('cars').select('*');
        const { data: scooty } = await supabase.from('scooty').select('*');

        const allVehicles = [...(bikes || []), ...(cars || []), ...(scooty || [])];

        const enrichedBookings = bookings.map(booking => {
            const vehicle = allVehicles.find(v => v.id === booking.vehicle_id);
            const duration = parseInt(booking.duration) || 0;
            const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
            const totalAmount = duration * vehiclePrice;
            const advancePayment = parseFloat(booking.advance_payment) || Math.ceil(totalAmount * 0.3);
            const remainingAmount = totalAmount - advancePayment;

            return {
                id: booking.id,
                booking_id: booking.booking_id || null,
                customerName: booking.users?.full_name || 'N/A',
                customerEmail: booking.users?.email || 'N/A',
                customerPhone: booking.users?.phone_number || 'N/A',
                vehicleName: vehicle ? vehicle.name : 'N/A',
                vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
                vehicleCategory: vehicle ? vehicle.category : booking.vehicle_category || 'N/A',
                start_date: booking.start_date || 'N/A',
                start_time: booking.start_time || 'N/A',
                duration: duration,
                total_amount: totalAmount,
                advance_payment: advancePayment,
                remaining_amount: remainingAmount,
                status: booking.status || 'pending',
                refund_amount: parseFloat(booking.refund_amount) || 0,
                refund_status: booking.refund_status || 'N/A',
                refund_timestamp: booking.refund_timestamp || null,
                refund_details: booking.refund_details || null,
                refund_deduction: booking.refund_deduction !== undefined && booking.refund_deduction !== null ? parseFloat(booking.refund_deduction) : 0,
                created_at: booking.created_at || null,
                confirmation_timestamp: booking.confirmation_timestamp || null,
                cancelled_timestamp: booking.cancelled_timestamp || null,
                transaction_id: booking.transaction_id || 'N/A',
                refund_id: booking.refund_id || null
            };
        });

        res.json({
            data: enrichedBookings,
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                total: bookings.length,
                pages: Math.ceil(bookings.length / (parseInt(req.query.limit) || 20))
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
};

// Admin: Get single booking
const getBookingById = async (req, res) => {
    try {
        const { data: booking, error } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        let vehicle;
        if (booking.vehicle_type === 'bike') {
            const { data } = await supabase.from('bikes').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'car') {
            const { data } = await supabase.from('cars').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'scooty') {
            const { data } = await supabase.from('scooty').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        }

        const duration = parseInt(booking.duration) || 0;
        const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
        const totalAmount = duration * vehiclePrice;
        const advancePayment = parseFloat(booking.advance_payment) || Math.ceil(totalAmount * 0.3);
        const remainingAmount = totalAmount - advancePayment;

        const enrichedBooking = {
            id: booking.id,
            booking_id: booking.booking_id || null,
            customerName: booking.users?.full_name || 'N/A',
            customerEmail: booking.users?.email || 'N/A',
            customerPhone: booking.users?.phone_number || 'N/A',
            vehicleName: vehicle ? vehicle.name : 'N/A',
            vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
            vehicleCategory: vehicle ? vehicle.category : booking.vehicle_category || 'N/A',
            start_date: booking.start_date || 'N/A',
            start_time: booking.start_time || 'N/A',
            duration: duration,
            total_amount: totalAmount,
            advance_payment: advancePayment,
            remaining_amount: remainingAmount,
            status: booking.status || 'pending',
            refund_amount: parseFloat(booking.refund_amount) || 0,
            refund_status: booking.refund_status || 'N/A',
            refund_timestamp: booking.refund_timestamp || null,
            refund_details: booking.refund_details || null,
            refund_deduction: booking.refund_deduction !== undefined && booking.refund_deduction !== null ? parseFloat(booking.refund_deduction) : 0,
            created_at: booking.created_at || null,
            confirmation_timestamp: booking.confirmation_timestamp || null,
            cancelled_timestamp: booking.cancelled_timestamp || null,
            transaction_id: booking.transaction_id || 'N/A',
            refund_id: booking.refund_id || null
        };

        res.json(enrichedBooking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Error fetching booking' });
    }
};

// Admin: Delete booking
const deleteBooking = async (req, res) => {
    try {
        const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Error deleting booking' });
    }
};

// Admin: Update booking
const updateBooking = async (req, res) => {
    try {
        const { startDate, startTime, duration, status, totalAmount, advancePayment, remainingAmount } = req.body;
        const { data, error } = await supabase
            .from('bookings')
            .update({
                start_date: startDate,
                start_time: startTime,
                duration: duration,
                status: status,
                total_amount: totalAmount,
                advance_payment: advancePayment,
                remaining_amount: remainingAmount,
                updated_at: getISTTimestamp()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Error updating booking' });
    }
};

// Admin: Confirm booking
const confirmBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        console.log('Confirming booking with ID:', bookingId);

        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    email,
                    full_name,
                    phone_number
                )
            `)
            .eq('id', bookingId)
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        let vehicle;
        if (booking.vehicle_type === 'bike') {
            const { data } = await supabase.from('bikes').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'car') {
            const { data } = await supabase.from('cars').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'scooty') {
            const { data } = await supabase.from('scooty').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        }

        const istTimestamp = getISTTimestamp();
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                confirmation_timestamp: istTimestamp,
                updated_at: istTimestamp
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // Send confirmation email
        if (booking.users?.email && booking.users?.full_name) {
            try {
                const duration = parseInt(booking.duration) || 0;
                const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = parseFloat(booking.advance_payment) || Math.ceil(totalAmount * 0.3);
                const remainingAmount = totalAmount - advancePayment;

                const pdfBuffer = await generateInvoiceBuffer(
                    booking.booking_id || booking.id,
                    booking.users.full_name,
                    booking.users.email,
                    vehicle ? vehicle.name : 'Vehicle',
                    duration,
                    `${booking.start_date} ${booking.start_time}`,
                    totalAmount,
                    advancePayment
                );

                // Build Google Calendar link
                const dayjs = require('dayjs');
                const start = dayjs(`${booking.start_date}T${booking.start_time}`);
                const end = start.add(duration, 'hour');
                const formatForCal = (d) => {
                    const iso = (new Date(d)).toISOString();
                    return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                const gcalDates = `${formatForCal(start)}/${formatForCal(end)}`;
                const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
                const gcalText = encodeURIComponent(`RentHub booking ${bookingId} — ${vehicle ? vehicle.name : 'Vehicle'}`);
                const gcalDetails = encodeURIComponent(`Booking ID: ${bookingId}\nVehicle: ${vehicle ? vehicle.name : 'Vehicle'}\nPickup: ${booking.start_date} ${booking.start_time}`);
                const gcalUrl = `${gcalBase}&text=${gcalText}&dates=${gcalDates}&details=${gcalDetails}`;

                const mailHtml = `
                    <div style="font-family: Arial, sans-serif; color: #222;">
                      <h2 style="color:#0b5cff;">Hello ${booking.users.full_name},</h2>
                      <p>Your booking is confirmed! Please find your invoice attached.</p>
                      <h3>Booking Details</h3>
                      <table style="width:100%; border-collapse: collapse;">
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Booking ID</b></td><td style="padding:6px; border:1px solid #eee;">${bookingId}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #eee;">${vehicle ? vehicle.name : 'Vehicle'}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Pickup Date & Time</b></td><td style="padding:6px; border:1px solid #eee;">${booking.start_date} ${booking.start_time}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Duration</b></td><td style="padding:6px; border:1px solid #eee;">${duration} hours</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Total Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${totalAmount}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Advance Paid</b></td><td style="padding:6px; border:1px solid #eee;">₹${advancePayment}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Remaining Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${remainingAmount}</td></tr>
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
                    to: booking.users.email,
                    subject: 'Booking Confirmed – RentHub',
                    html: mailHtml,
                    attachments: [
                        { filename: 'booking_invoice.pdf', content: pdfBuffer }
                    ]
                };

                await sendEmail(mailOptions);
                console.log('✅ Booking confirmation email sent');
            } catch (emailError) {
                console.error('❌ Error sending confirmation email:', emailError);
            }
        }

        // Retell call
        if (booking.users?.phone_number) {
            try {
                const duration = parseInt(booking.duration) || 0;
                const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = parseFloat(booking.advance_payment) || Math.ceil(totalAmount * 0.3);
                const remainingAmount = totalAmount - advancePayment;

                const bookingDetails = {
                    bookingId,
                    vehicleName: vehicle ? vehicle.name : 'N/A',
                    vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
                    startDate: booking.start_date || 'N/A',
                    startTime: booking.start_time || 'N/A',
                    duration,
                    totalAmount,
                    advancePayment,
                    remainingAmount,
                    userName: booking.users.full_name || 'Customer'
                };
                await makeBookingConfirmationCall(booking.users.phone_number, bookingDetails);
                console.log('📞 Call initiated');
            } catch (callError) {
                console.error('❌ Call error:', callError);
            }
        }

        // Immediate reminder check
        try {
            await sendImmediateReminderIfNeeded(bookingId);
        } catch (reminderError) {
            console.error('❌ Reminder error:', reminderError);
        }

        res.json(updatedBooking);

    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ error: 'Error confirming booking' });
    }
};

// Admin: Reject booking
const rejectBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);

        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select(`id, user_id, vehicle_id, vehicle_type, start_date, start_time, duration, status, created_at, transaction_id, advance_payment`)
            .eq('id', bookingId)
            .single();

        if (fetchError) return res.status(500).json({ error: 'Error fetching booking' });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'pending') return res.status(400).json({ error: 'Only pending bookings can be rejected' });

        const reason = req.body && req.body.reason ? req.body.reason : null;
        const localTimestamp = getISTTimestamp();
        const refundAmount = booking.advance_payment || 100;
        let refundStatus = 'processing';
        let razorpayRefundId = null;

        if (booking.transaction_id && refundAmount > 0) {
            try {
                const refundResponse = await razorpay.payments.refund(booking.transaction_id, {
                    amount: refundAmount * 100,
                    speed: 'optimum',
                    notes: {
                        booking_id: bookingId,
                        reason: 'Booking rejected by admin',
                        rejection_reason: reason || 'Not specified',
                        rejected_at: localTimestamp
                    }
                });
                refundStatus = 'completed';
                razorpayRefundId = refundResponse.id;
            } catch (refundError) {
                console.error('Refund failed:', refundError);
            }
        } else if (refundAmount === 0) {
            refundStatus = 'not_applicable';
        }

        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                refund_status: refundStatus,
                refund_amount: refundAmount,
                refund_id: razorpayRefundId,
                refund_details: { method: 'auto_razorpay', original_tx: booking.transaction_id },
                rejection_timestamp: localTimestamp,
                refund_timestamp: refundStatus === 'completed' ? localTimestamp : null,
                refund_deduction: 0
            })
            .eq('id', bookingId);

        if (updateError) throw updateError;

        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';
            await supabase.from(vehicleTable).update({ is_available: true }).eq('id', booking.vehicle_id);
        }

        res.json({ message: 'Booking rejected successfully' });

    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ error: 'Error rejecting booking' });
    }
};

// Admin: Cancel booking
const cancelBookingAdmin = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const { data: booking, error: fetchError } = await supabase.from('bookings').select('*, users:user_id(*)').eq('id', bookingId).single();

        if (fetchError || !booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed bookings can be cancelled' });

        const now = new Date();
        const confirmationTime = booking.confirmation_timestamp ? new Date(booking.confirmation_timestamp) : now;
        const hoursSinceConfirmation = (now - confirmationTime) / (1000 * 60 * 60);

        const advancePayment = parseFloat(booking.advance_payment) || 100;
        let refundAmount = hoursSinceConfirmation <= 2 ? advancePayment : Math.round(advancePayment * 0.7);
        let deductionAmount = hoursSinceConfirmation > 2 ? Math.round(advancePayment * 0.3) : 0;
        const localCancelTimestamp = getISTTimestamp();

        let refundStatus = 'processing';
        let razorpayRefundId = null;

        if (booking.transaction_id && refundAmount > 0) {
            try {
                const refundResponse = await razorpay.payments.refund(booking.transaction_id, {
                    amount: refundAmount * 100,
                    speed: 'optimum',
                    notes: { booking_id: bookingId, reason: 'Booking cancelled by admin', cancelled_at: localCancelTimestamp }
                });
                refundStatus = 'completed';
                razorpayRefundId = refundResponse.id;
            } catch (e) {
                console.error('Refund failed:', e);
            }
        } else if (refundAmount === 0) refundStatus = 'not_applicable';

        const { data: updatedBooking, error: updateError } = await supabase.from('bookings').update({
            status: 'cancelled',
            refund_amount: refundAmount,
            refund_status: refundStatus,
            refund_id: razorpayRefundId,
            refund_details: req.body && req.body.refundDetails ? req.body.refundDetails : null,
            cancelled_timestamp: localCancelTimestamp,
            refund_deduction: deductionAmount,
            refund_timestamp: refundStatus === 'completed' ? localCancelTimestamp : null
        }).eq('id', bookingId).select().single();

        if (updateError) throw updateError;

        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';
            await supabase.from(vehicleTable).update({ is_available: true }).eq('id', booking.vehicle_id);
        }

        res.json({ message: 'Booking cancelled successfully', refundAmount, booking: updatedBooking });

    } catch (error) {
        console.error('Error in cancel booking endpoint:', error);
        res.status(500).json({ error: 'Error cancelling booking' });
    }
};

// Admin: Mark refund complete
const markRefundComplete = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const adminId = req.user.id;

        const { data: admin } = await supabase.from('users').select('is_admin').eq('id', adminId).single();
        if (!admin || !admin.is_admin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: booking, error: updateError } = await supabase.from('bookings').update({
            refund_status: 'completed',
            refund_timestamp: getISTTimestamp(),
            refund_completed_by: adminId
        }).eq('id', bookingId).select('*, users:user_id(email, full_name)').single();

        if (updateError) throw updateError;

        // Log
        await supabase.from('activity_log').insert({
            admin_id: adminId, action: 'refund_completed', booking_id: bookingId, details: { refund_amount: booking.refund_amount }
        });

        // Email
        if (booking.users?.email) {
            await sendRefundCompleteEmail(booking.users.email, booking.users.full_name, booking.booking_id || booking.id, booking.refund_amount, booking.refund_timestamp, booking.refund_details);
        }

        res.json({ message: 'Refund marked as completed', booking });
    } catch (error) {
        console.error('Error completing refund:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Send SOS
const sendSOS = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const { data: booking } = await supabase.from('bookings').select('*, users:user_id(email, full_name, phone_number)').eq('id', bookingId).single();

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if ((booking.status || '').toLowerCase() !== 'confirmed') return res.status(400).json({ error: 'SOS can only be sent for confirmed bookings' });

        const userEmail = booking.users?.email || ((Array.isArray(booking.users) && booking.users[0]?.email) ? booking.users[0].email : null);
        const userName = booking.users?.full_name || 'User';

        if (!userEmail) return res.status(404).json({ error: 'User email not found' });

        const sosToken = crypto.randomBytes(32).toString('hex');
        const frontendUrl = process.env.FRONTEND_URL || 'https://rentahub-service.vercel.app';
        const sosActivationLink = `${frontendUrl}/sos-activate?token=${sosToken}&bookingId=${bookingId}`;

        if (!global.sosTokens) global.sosTokens = {};
        global.sosTokens[sosToken] = { bookingId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };

        await sendSOSLinkEmail(userEmail, userName, sosActivationLink);
        res.json({ success: true, message: 'SOS activation link sent to ' + userEmail });

    } catch (error) {
        res.status(500).json({ error: 'Error sending SOS: ' + error.message });
    }
};



// Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Fetching dashboard stats...');

        const { count: bikeCount, error: bikeError } = await supabase.from('bikes').select('id', { count: 'exact', head: true });
        if (bikeError) console.error('Bike count error:', bikeError);

        const { count: carCount, error: carError } = await supabase.from('cars').select('id', { count: 'exact', head: true });
        if (carError) console.error('Car count error:', carError);

        const { count: scootyCount, error: scootyError } = await supabase.from('scooty').select('id', { count: 'exact', head: true });
        if (scootyError) console.error('Scooty count error:', scootyError);

        const totalVehicles = (bikeCount || 0) + (carCount || 0) + (scootyCount || 0);
        console.log(`Vehicles: ${totalVehicles} (Bikes: ${bikeCount}, Cars: ${carCount}, Scooty: ${scootyCount})`);

        const { count: activeUsers, error: userError } = await supabase.from('users').select('id', { count: 'exact', head: true });
        if (userError) console.error('User count error:', userError);
        console.log(`Active Users: ${activeUsers}`);

        const { count: totalBookingsMonth, error: monthError } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
            .gte('start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
        if (monthError) console.error('Month bookings error:', monthError);

        const { count: pendingBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: confirmedBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed');
        const { count: cancelledBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'cancelled');
        const { count: pendingRefunds } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['cancelled', 'rejected']).eq('refund_status', 'processing');

        console.log(`Bookings: Pending=${pendingBookings}, Confirmed=${confirmedBookings}, Cancelled=${cancelledBookings}, Refunds=${pendingRefunds}`);

        const today = new Date().toISOString().split('T')[0];
        const { count: todaysBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
            .gte('created_at', today + 'T00:00:00').lt('created_at', today + 'T23:59:59');

        const { data: recentBookings } = await supabase.from('bookings').select(`id, booking_id, status, created_at, users (full_name), vehicle_type`).order('created_at', { ascending: false }).limit(5);

        const recentActivity = (recentBookings || []).map(b => {
            let description = '';
            const userName = b.users?.full_name || 'User';
            let type = 'created';
            if (b.status === 'confirmed') type = 'confirmed';
            else if (b.status === 'cancelled') type = 'cancelled';
            else if (b.status === 'rejected') type = 'rejected';

            const displayId = b.booking_id || `#${b.id}`;

            if (b.status === 'confirmed') description = `Booking ${displayId} confirmed for ${userName}`;
            else if (b.status === 'cancelled') description = `Booking ${displayId} cancelled by ${userName}`;
            else if (b.status === 'rejected') description = `Booking ${displayId} rejected`;
            else description = `New booking ${displayId} from ${userName}`;

            return { type, description, timestamp: b.created_at };
        });

        res.json({ totalVehicles, totalBookingsMonth, activeUsers, pendingBookings, confirmedBookings, cancelledBookings, pendingRefunds, todaysBookings, recentActivity });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};

// Users management
const getAllUsers = async (req, res) => {
    try {
        const { data } = await supabase.from('users').select('*');
        const mapped = (data || []).map(u => ({
            id: u.id, fullName: u.full_name, adminName: u.admin_name, email: u.email, phoneNumber: u.phone_number, isAdmin: u.is_admin, isBlocked: u.is_blocked
        }));
        res.json(mapped);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const getUserById = async (req, res) => {
    try {
        const { data } = await supabase.from('users').select('*').eq('id', req.params.id).single();
        res.json({ id: data.id, fullName: data.full_name, email: data.email, phoneNumber: data.phone_number, isAdmin: data.is_admin, isBlocked: data.is_blocked, createdAt: data.created_at });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const updateUser = async (req, res) => {
    try {
        const { fullName, email, phoneNumber } = req.body;
        const { data } = await supabase.from('users').update({ full_name: fullName, email, phone_number: phoneNumber }).eq('id', req.params.id).select().single();
        res.json(data);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const blockUser = async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const { data } = await supabase.from('users').update({ is_blocked: isBlocked }).eq('id', req.params.id).select().single();
        res.json(data);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

// Vehicles management
const getAllVehicles = async (req, res) => {
    try {
        const bikes = await supabase.from('bikes').select('*');
        const cars = await supabase.from('cars').select('*');
        const scooty = await supabase.from('scooty').select('*');
        const allVehicles = [
            ...(bikes.data || []).map(v => ({ ...v, type: 'bike' })),
            ...(cars.data || []).map(v => ({ ...v, type: 'car' })),
            ...(scooty.data || []).map(v => ({ ...v, type: 'scooty' }))
        ];
        res.json(allVehicles);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const getVehicleById = async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { data } = await supabase.from(type).select('*').eq('id', id).single();
        res.json(data);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const updateVehicle = async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { data } = await supabase.from(type).update(req.body).eq('id', id).select().single();
        res.json(data);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const deleteVehicle = async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        await supabase.from(type).delete().eq('id', id);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const addVehicle = async (req, res) => {
    try {
        let { type } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { data } = await supabase.from(type).insert([req.body]).select().single();
        res.status(201).json(data);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const getPolicies = async (req, res) => {
    try {
        const { data } = await supabase.from('policies').select('*');
        res.json(data || []);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

// Scheduler / Reminder methods
const manualReminderCheck = async (req, res) => {
    try {
        console.log('📧 Manual reminder check triggered by admin');
        const result = await checkAndSendReminders();
        res.json(result);
    } catch (error) {
        console.error('Error in manual reminder check:', error);
        res.status(500).json({ error: 'Error checking reminders', details: error.message });
    }
};

const cronReminderCheck = async (req, res) => {
    // Check for secret key in query params
    const secret = req.query.secret;
    const CRON_SECRET = process.env.CRON_SECRET || 'renthub_cron_secret_2024';

    if (secret !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
    }

    try {
        console.log('⏰ External Cron triggered reminder check');
        const result = await checkAndSendReminders();
        res.json(result);
    } catch (error) {
        console.error('Error in cron reminder check:', error);
        res.status(500).json({ error: 'Error checking reminders', details: error.message });
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    deleteBooking,
    updateBooking,
    confirmBooking,
    rejectBooking,
    cancelBookingAdmin,
    markRefundComplete,
    sendSOS,
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUser,
    blockUser,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    addVehicle,
    getPolicies,
    manualReminderCheck,
    cronReminderCheck
};

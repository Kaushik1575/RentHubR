const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const supabase = require('../config/supabase');
const { sendBookingConfirmationEmail, sendBookingCancelledEmail, sendNearestLocationsEmail, sendEmail } = require('../config/emailService');
const { findNearbyPlaces } = require('../services/nearbyPlacesService');
const ADMIN_EMAILS = ['jyoti2006@gmail.com'];

// GET / POST /api/voice/welcome
// Generates TwiML voice prompt asking customer to press 1 to confirm
router.all('/welcome', (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const bookingId = req.query.bookingId || req.body.bookingId || 'Your Booking';
    const userName = req.query.userName || req.body.userName || 'Customer';
    const vehicleName = req.query.vehicleName || req.body.vehicleName || 'Vehicle';
    const vehicleType = req.query.vehicleType || req.body.vehicleType || 'Vehicle';
    const startDate = req.query.startDate || req.body.startDate || 'scheduled date';
    const startTime = req.query.startTime || req.body.startTime || 'scheduled time';
    const duration = req.query.duration || req.body.duration || '1';

    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    const actionUrl = `${baseUrl}/api/voice/process-keypress?bookingId=${encodeURIComponent(bookingId)}&userName=${encodeURIComponent(userName)}&vehicleName=${encodeURIComponent(vehicleName)}`;

    const gather = twiml.gather({
        numDigits: 1,
        action: actionUrl,
        method: 'POST',
        timeout: 10
    });

    const userEmail = req.query.userEmail || req.body.userEmail || '';

    const promptText = `Hello ${userName}! This is RentHub calling regarding your booking request for ${vehicleName}. ` +
        `Booking ID is ${bookingId}, scheduled for ${startDate} at ${startTime} for ${duration} hours. ` +
        (userEmail ? `We have sent your booking summary to ${userEmail}. ` : `We have sent your booking summary to your email. `) +
        `Please state if you would like to confirm your booking or cancel your booking. ` +
        `You can also press 1 to confirm or press 2 to cancel. ` +
        `Thank you for choosing RentHub!`;

    gather.say({ voice: 'Polly.Aditi', language: 'en-IN' }, promptText);

    // If user doesn't press anything within timeout
    twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' }, "We didn't receive any keypress input. Thank you for choosing RentHub! Goodbye!");

    res.type('text/xml');
    res.send(twiml.toString());
});

// POST /api/voice/process-keypress
// Processes DTMF keypad press (1 = Confirm, 2 = Cancel)
router.post('/process-keypress', async (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const digit = req.body.Digits;
    const bookingId = req.query.bookingId || req.body.bookingId;
    const userNameParam = req.query.userName || 'Customer';
    const vehicleNameParam = req.query.vehicleName || 'Vehicle';

    console.log(`🎙️ [Twilio Voice] Keypress received: Digits='${digit}' for Booking ID: ${bookingId}`);

    if (digit === '1') {
        twiml.say(
            { voice: 'Polly.Aditi', language: 'en-IN' },
            "Thank you for confirming! Please remember to bring a valid government ID at pickup. Thank you for choosing RentHub!"
        );

        // Update DB status to confirmed
        try {
            if (bookingId) {
                const { data, error } = await supabase
                    .from('bookings')
                    .update({
                        status: 'confirmed',
                        confirmation_timestamp: new Date().toISOString()
                    })
                    .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`)
                    .select('*, users(full_name, email)');

                if (error) {
                    console.error('❌ DB Update Error (Voice Confirm):', error.message);
                } else if (data && data.length > 0) {
                    console.log('✅ Booking updated to CONFIRMED via Voice Call:', bookingId);
                    const booking = data[0];
                    const userEmail = booking.users?.email || booking.user_email;
                    const userName = booking.users?.full_name || userNameParam;
                    if (userEmail) {
                        await sendBookingConfirmationEmail(userEmail, userName, booking);
                    }
                }
            }
        } catch (dbErr) {
            console.error('❌ Exception in Voice DB Update:', dbErr);
        }

    } else if (digit === '2') {
        twiml.say(
            { voice: 'Polly.Aditi', language: 'en-IN' },
            "Your booking request has been cancelled. An email has been sent to submit your refund details if applicable. Thank you for visiting RentHub!"
        );

        try {
            if (bookingId) {
                const localCancelTimestamp = new Date().toISOString();
                const { data, error } = await supabase
                    .from('bookings')
                    .update({ 
                        status: 'cancelled',
                        cancelled_timestamp: localCancelTimestamp
                    })
                    .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`)
                    .select('*, users(full_name, email)');

                if (error) {
                    console.error('❌ DB Cancel Error (Voice Cancel):', error.message);
                } else {
                    console.log('🚫 Booking CANCELLED via Voice Call:', bookingId);
                    const booking = (data && data[0]) || {};
                    const userEmail = booking.users?.email || booking.user_email;
                    const userName = booking.users?.full_name || userNameParam;
                    const vehicleName = booking.vehicle_name || vehicleNameParam;

                    if (userEmail) {
                        await sendBookingCancelledEmail(userEmail, userName, bookingId, vehicleName);
                        console.log(`✉️ Cancellation email with refund link sent to ${userEmail}`);
                    }
                }
            }
        } catch (dbErr) {
            console.error('❌ Exception in Voice DB Cancel:', dbErr);
        }
    } else if (digit === '3') {
        twiml.say(
            { voice: 'Polly.Aditi', language: 'en-IN' },
            "We have dispatched the nearest bike garages and petrol pump locations directly to your email address. Please check your inbox. Safe riding with RentHub!"
        );

        try {
            if (bookingId) {
                const { data } = await supabase
                    .from('bookings')
                    .select('*, users(full_name, email)')
                    .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`);

                const booking = (data && data[0]) || {};
                const userEmail = booking.users?.email || booking.user_email;
                const userName = booking.users?.full_name || userNameParam;
                const vehicleName = booking.vehicle_name || vehicleNameParam;

                const nearbyData = await findNearbyPlaces(booking?.pickup_location);
                if (userEmail) {
                    await sendNearestLocationsEmail(
                        userEmail,
                        userName,
                        { bookingId: bookingId, vehicleName: vehicleName },
                        nearbyData
                    );
                    console.log(`✉️ [Admin IVR] Dispatched nearest locations email to ${userEmail}`);
                }
            }
        } catch (dbErr) {
            console.error('❌ Exception in Admin Voice Keypress 3:', dbErr);
        }
    } else {
        twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' }, "Invalid option selected. Thank you for choosing RentHub! Goodbye!");
    }

    res.type('text/xml');
    res.send(twiml.toString());
});


// Handler for Retell AI Webhooks & Custom Tool Calls
const handleRetellWebhook = async (req, res) => {
    try {
        const body = req.body || {};
        console.log('🎙️ [Retell AI Webhook] Payload received:', JSON.stringify(body));

        const event = body.event || body.type;
        const callData = body.call || body;
        const metadata = callData.metadata || body.args || (callData.retell_llm_dynamic_variables) || {};
        const bookingId = metadata.booking_id || metadata.bookingId;
        const userEmail = metadata.user_email || metadata.userEmail;
        const userName = metadata.user_name || metadata.userName || 'Customer';
        const vehicleName = metadata.vehicle_name || metadata.vehicleName || 'Vehicle';
        const userPhone = metadata.user_phone || metadata.userPhone || callData.to_number || 'N/A';
        const gpsLocation = metadata.gps_location || metadata.gpsLocation || null;

        const action = body.name || (callData.custom_analysis_data && callData.custom_analysis_data.user_intent) || (body.args && body.args.action);

        if (action === 'confirm' || action === 'confirm_booking' || event === 'booking_confirmed') {
            console.log(`✅ [Retell AI] Booking confirmed for ID: ${bookingId}`);
            if (bookingId) {
                const { data } = await supabase
                    .from('bookings')
                    .update({ status: 'confirmed', confirmation_timestamp: new Date().toISOString() })
                    .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`)
                    .select('*, users(full_name, email)');

                const booking = (data && data[0]) || {};
                const email = userEmail || booking.users?.email || booking.user_email;
                if (email) {
                    await sendBookingConfirmationEmail(email, userName, booking);
                }
            }
            return res.json({ success: true, message: 'Booking confirmed via Retell AI' });

        } else if (action === 'cancel' || action === 'cancel_booking' || event === 'booking_cancelled') {
            console.log(`🚫 [Retell AI] Booking cancelled for ID: ${bookingId}`);
            if (bookingId) {
                const { data } = await supabase
                    .from('bookings')
                    .update({ status: 'cancelled', cancelled_timestamp: new Date().toISOString() })
                    .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`)
                    .select('*, users(full_name, email)');

                const booking = (data && data[0]) || {};
                const email = userEmail || booking.users?.email || booking.user_email;
                if (email) {
                    await sendBookingCancelledEmail(email, userName, bookingId, vehicleName);
                }
            }
            return res.json({ success: true, message: 'Booking cancelled via Retell AI' });

        // 3. SOS Solved Action
        } else if (action === 'resolve_sos' || action === 'sos_resolved' || event === 'sos_resolved') {
            console.log(`✅ [Retell AI] SOS resolved for booking ${bookingId}`);
            return res.json({
                success: true,
                message: 'Issue marked as resolved',
                response: 'Bohat accha! Aapka issue solve ho gaya hai. Safe riding!'
            });

        // 4. Send Nearest Locations to Email (Option 3 / Nearby Assistance)
        } else if (
            action === 'send_nearest_locations' ||
            action === 'send_location' ||
            action === 'send_nearby_help' ||
            action === 'send_garage_petrol_pump' ||
            action === 'send_nearby_locations_email' ||
            event === 'location_email_requested'
        ) {
            console.log(`📍 [Admin Retell AI] Dispathing Nearest Locations Email for Booking: ${bookingId}, Email: ${userEmail}`);

            let resolvedEmail = userEmail;
            let resolvedName = userName;
            let resolvedVehicle = vehicleName;

            if (bookingId) {
                let query = supabase.from('bookings').select('*, users:user_id(full_name, email)');
                if (String(bookingId).startsWith('RH')) {
                    query = query.eq('booking_id', bookingId);
                } else {
                    query = query.eq('id', bookingId);
                }
                const { data: dbBooking } = await query.single();
                if (dbBooking) {
                    resolvedEmail = resolvedEmail || dbBooking.users?.email || dbBooking.user_email;
                    resolvedName = resolvedName !== 'Customer' ? resolvedName : (dbBooking.users?.full_name || 'Customer');
                    resolvedVehicle = dbBooking.vehicle_name || resolvedVehicle;
                }
            }

            const nearbyData = await findNearbyPlaces(gpsLocation);

            if (resolvedEmail) {
                await sendNearestLocationsEmail(
                    resolvedEmail,
                    resolvedName,
                    {
                        bookingId: bookingId || 'Active Ride',
                        vehicleName: resolvedVehicle
                    },
                    nearbyData
                );
                console.log(`✉️ [Admin Retell AI] Successfully sent nearest locations email to ${resolvedEmail}`);
            }

            return res.json({
                success: true,
                response: `Maine aapke registered email par nearest bike garage aur petrol pump ki Google Maps location bhej di hai. Aap apna inbox check kar sakte hain.`,
                message: `Locations sent to ${resolvedEmail}`,
                nearbyData: nearbyData
            });

        // 5. Escalate to Roadside Mechanic
        } else if (action === 'escalate_sos_mechanic' || action === 'sos_unresolved' || action === 'request_mechanic' || event === 'mechanic_requested') {
            console.log(`🚨 [Admin Retell AI] Roadside Mechanic Dispatch requested for Booking: ${bookingId}`);
            const issueDetail = (body.args && (body.args.issue || body.args.notes || body.args.reason)) || 'Customer requested mechanic';

            try {
                await sendEmail({
                    to: ADMIN_EMAILS,
                    subject: `🚨 [URGENT DISPATCH - RETELL CALL] Roadside Mechanic for Booking ${bookingId || 'N/A'}`,
                    html: `<h3>Roadside Mechanic Alert</h3><p>Customer: ${userName} (${userPhone})<br>Vehicle: ${vehicleName}<br>Issue: ${issueDetail}</p>`
                });
            } catch (mailErr) {
                console.error('Error sending Retell mechanic dispatch email:', mailErr.message);
            }

            return res.json({
                success: true,
                message: 'Roadside mechanic alert sent to emergency operations team.',
                response: 'Emergency roadside mechanic alert register ho gaya hai. Hamari team aapse turant contact karegi.'
            });
        }

        res.json({ success: true, message: 'Retell AI Webhook Connected Successfully' });
    } catch (error) {
        console.error('❌ Error handling Retell AI webhook:', error);
        res.status(500).json({ error: error.message });
    }
};

// Mount handlers across multiple URL path variations
router.all('/retell-webhook', handleRetellWebhook);
router.all('/webhook', handleRetellWebhook);
router.all('/', (req, res) => res.json({ success: true, message: 'Voice API Active' }));

module.exports = router;


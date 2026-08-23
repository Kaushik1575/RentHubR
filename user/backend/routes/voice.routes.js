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

    const promptText = `Namaste ${userName} ji! Mai RentHub se bol rahi hu aapki booking ID ${bookingId} ki verification ke liye. Booking confirm karne ke liye 1 dabaye, ya cancel karne ke liye 2 dabaye.`;

    gather.say({ voice: 'Polly.Aditi', language: 'hi-IN' }, promptText);

    // If user doesn't press anything within timeout
    twiml.say({ voice: 'Polly.Aditi', language: 'hi-IN' }, "Aapka koi response nahi mila. RentHub par aane ke liye dhanyavaad! Alvida!");

    res.type('text/xml');
    res.send(twiml.toString());
});

// Helper function to safely update booking by either numeric ID or string booking_id
async function updateBookingByAnyId(bookingId, updates) {
    if (!bookingId) return { data: null, error: 'No booking ID' };
    const cleanId = String(bookingId).trim();
    let query = supabase.from('bookings').update(updates);
    const numId = Number(cleanId);

    if (!isNaN(numId) && String(numId) === cleanId) {
        query = query.or(`id.eq.${numId},booking_id.eq.${cleanId}`);
    } else {
        query = query.eq('booking_id', cleanId);
    }

    return await query.select('*, users:user_id(full_name, email)');
}

// POST /api/voice/process-keypress
// Processes DTMF keypad press (1 = Confirm, 2 = Cancel)
router.post('/process-keypress', async (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const digit = req.body.Digits;
    const bookingId = req.query.bookingId || req.body.bookingId;
    const userNameParam = req.query.userName || 'Customer';
    const vehicleNameParam = req.query.vehicleName || 'Vehicle';
    const userEmailParam = req.query.userEmail || req.body.userEmail || '';

    console.log(`🎙️ [Twilio Voice] Keypress received: Digits='${digit}' for Booking ID: ${bookingId}`);

    if (digit === '1') {
        twiml.say(
            { voice: 'Polly.Aditi', language: 'hi-IN' },
            "Booking confirm karne ke liye dhanyavaad! Kripya pickup ke samay ek valid government ID card saath laana na bhulein. RentHub ke saath aapka safar shubh ho! Alvida."
        );

        // Update DB status to confirmed
        try {
            if (bookingId) {
                const { data, error } = await updateBookingByAnyId(bookingId, {
                    status: 'confirmed',
                    confirmation_timestamp: new Date().toISOString()
                });

                if (error) {
                    console.error('❌ DB Update Error (Voice Confirm):', error);
                } else if (data && data.length > 0) {
                    console.log('✅ Booking updated to CONFIRMED via Voice Call:', bookingId);
                    const booking = data[0];
                    const userEmail = (booking.users && booking.users.email) || booking.user_email || userEmailParam;
                    const userName = (booking.users && booking.users.full_name) || userNameParam;
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
            { voice: 'Polly.Aditi', language: 'hi-IN' },
            `Aapki booking request cancel kar di gayi hai. Refund details ki jankari aapke email par bhej di gayi hai. RentHub par aane ke liye dhanyavaad! Alvida.`
        );

        try {
            if (bookingId) {
                const localCancelTimestamp = new Date().toISOString();
                const { data, error } = await updateBookingByAnyId(bookingId, {
                    status: 'cancelled',
                    cancelled_timestamp: localCancelTimestamp
                });

                if (error) {
                    console.error('❌ DB Cancel Error (Voice Cancel):', error);
                } else {
                    console.log('🚫 Booking CANCELLED via Voice Call:', bookingId);
                    const booking = (data && data[0]) || {};
                    const userEmail = (booking.users && booking.users.email) || booking.user_email || userEmailParam;
                    const userName = (booking.users && booking.users.full_name) || userNameParam;
                    const vehicleName = booking.vehicle_name || vehicleNameParam;

                    if (userEmail) {
                        await sendBookingCancelledEmail(userEmail, userName, bookingId, vehicleName);
                        console.log(`✉️ Cancellation email with refund link sent to ${userEmail}`);
                    } else {
                        console.error('⚠️ No recipient email found for cancellation notification.');
                    }
                }
            }
        } catch (dbErr) {
            console.error('❌ Exception in Voice DB Cancel:', dbErr);
        }

    } else if (digit === '3') {
        twiml.say(
            { voice: 'Polly.Aditi', language: 'hi-IN' },
            "Maine aapke registered email par nearest bike garage aur petrol pump ki Google Maps location bhej di hai. Kripya apna email check karein. RentHub ke saath safe ride karein! Alvida."
        );

        try {
            if (bookingId) {
                let query = supabase.from('bookings').select('*, users:user_id(full_name, email)');
                if (String(bookingId).startsWith('RH')) {
                    query = query.eq('booking_id', bookingId);
                } else {
                    query = query.eq('id', bookingId);
                }
                const { data: dbBooking } = await query.single();
                const recipientEmail = (dbBooking && (dbBooking.users?.email || dbBooking.user_email)) || userEmailParam;
                const recipientName = (dbBooking && (dbBooking.users?.full_name || dbBooking.user_name)) || userNameParam;
                const vehicle = (dbBooking && dbBooking.vehicle_name) || vehicleNameParam;

                const nearbyData = await findNearbyPlaces(dbBooking?.pickup_location);
                if (recipientEmail) {
                    await sendNearestLocationsEmail(
                        recipientEmail,
                        recipientName,
                        { bookingId: bookingId, vehicleName: vehicle },
                        nearbyData
                    );
                    console.log(`✉️ [IVR] Dispatched nearest locations email to ${recipientEmail}`);
                }
            }
        } catch (err) {
            console.error('❌ Exception in IVR Keypress 3:', err);
        }
    } else {
        twiml.say({ voice: 'Polly.Aditi', language: 'hi-IN' }, "Hame koi sahi option nahi mila. RentHub se judne ke liye dhanyavaad! Alvida.");
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
        const bookingId = metadata.booking_id || metadata.bookingId || (body.args && body.args.booking_id);
        const userEmail = metadata.user_email || metadata.userEmail || (body.args && body.args.user_email);
        const userName = metadata.user_name || metadata.userName || 'Customer';
        const vehicleName = metadata.vehicle_name || metadata.vehicleName || 'Vehicle';
        const userPhone = metadata.user_phone || metadata.userPhone || callData.to_number || 'N/A';
        const gpsLocation = (body.args && (body.args.location || body.args.area || body.args.landmark || body.args.city || body.args.gps_location || body.args.address)) ||
                            (body.arguments && (body.arguments.location || body.arguments.area || body.arguments.landmark || body.arguments.city || body.arguments.gps_location || body.arguments.address)) ||
                            metadata.gps_location ||
                            metadata.gpsLocation ||
                            metadata.location ||
                            null;

        const action = body.name || body.func_name || body.function_name || body.tool_name || (callData.custom_analysis_data && callData.custom_analysis_data.user_intent) || (body.args && body.args.action) || (body.arguments && body.arguments.action) || '';

        // 1. Booking Confirmation Action
        if (action === 'confirm' || action === 'confirm_booking' || event === 'booking_confirmed') {
            console.log(`✅ [Retell AI] Booking confirmed for ID: ${bookingId}`);
            if (bookingId) {
                const { data } = await updateBookingByAnyId(bookingId, {
                    status: 'confirmed',
                    confirmation_timestamp: new Date().toISOString()
                });

                const booking = (data && data[0]) || {};
                const email = userEmail || (booking.users && booking.users.email) || booking.user_email;
                if (email) {
                    await sendBookingConfirmationEmail(email, userName, booking);
                }
            }
            return res.json({ success: true, message: 'Booking confirmed via Retell AI' });

        // 2. Booking Cancellation Action
        } else if (action === 'cancel' || action === 'cancel_booking' || event === 'booking_cancelled') {
            console.log(`🚫 [Retell AI] Booking cancelled for ID: ${bookingId}`);
            if (bookingId) {
                const { data } = await updateBookingByAnyId(bookingId, {
                    status: 'cancelled',
                    cancelled_timestamp: new Date().toISOString()
                });

                const booking = (data && data[0]) || {};
                const email = userEmail || (booking.users && booking.users.email) || booking.user_email;
                if (email) {
                    await sendBookingCancelledEmail(email, userName, bookingId, vehicleName);
                }
            }
            return res.json({ success: true, message: 'Booking cancelled via Retell AI' });

        // 3. SOS Solved Action (User solved problem with AI advice)
        } else if (action === 'resolve_sos' || action === 'sos_resolved' || event === 'sos_resolved') {
            console.log(`✅ [Retell AI] SOS marked as resolved by user for Booking: ${bookingId}`);
            return res.json({
                success: true,
                message: 'Thank you! We have logged that your issue has been resolved. Safe riding with RentHub!',
                response: 'Bohat accha! Aapka issue solve ho gaya hai. RentHub ke saath safe ride karein!'
            });

        // 4. Send Nearest Bike Garage / Petrol Pump Locations to Email (Option 3 / Customer Requests Location)
        } else if (
            action === 'send_nearest_locations' ||
            action === 'send_location' ||
            action === 'send_locations' ||
            action === 'send_nearby_help' ||
            action === 'send_garage_petrol_pump' ||
            action === 'send_nearby_locations_email' ||
            action === 'nearest_locations' ||
            action === 'dispatch_location' ||
            action === 'email_location' ||
            event === 'location_email_requested'
        ) {
            console.log(`📍 [Retell AI] Dispathing Nearest Locations Email for Booking: ${bookingId}, Email: ${userEmail}`);
            
            const successVoiceMessage = "Maine aapke registered email par nearest bike garage aur petrol pump ki Google Maps location bhej di hai. Aap apna inbox check kar sakte hain.";

            // Respond instantly to Retell so voice call NEVER times out or says 'technical glitch'
            res.json({
                result: successVoiceMessage,
                response: successVoiceMessage,
                success: true,
                message: `Locations sent to ${userEmail || 'customer email'}`
            });

            // Perform geocoding, nearby discovery & email sending asynchronously in background
            (async () => {
                try {
                    let resolvedEmail = userEmail;
                    let resolvedName = userName;
                    let resolvedVehicle = vehicleName;
                    let dbBooking = null;

                    if (bookingId) {
                        let query = supabase.from('bookings').select('*, users:user_id(full_name, email)');
                        if (String(bookingId).startsWith('RH')) {
                            query = query.eq('booking_id', bookingId);
                        } else {
                            query = query.eq('id', bookingId);
                        }
                        const { data } = await query.single();
                        if (data) {
                            dbBooking = data;
                            resolvedEmail = resolvedEmail || dbBooking.users?.email || dbBooking.user_email;
                            resolvedName = resolvedName !== 'Customer' ? resolvedName : (dbBooking.users?.full_name || 'Customer');
                            resolvedVehicle = dbBooking.vehicle_name || resolvedVehicle;
                        }
                    }

                    const nearbyData = await findNearbyPlaces(gpsLocation, dbBooking?.pickup_location);

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
                        console.log(`✉️ [Retell AI Background] Successfully sent nearest locations email to ${resolvedEmail}`);
                    } else {
                        console.warn('⚠️ [Retell AI Background] No recipient email found for nearest locations.');
                    }
                } catch (bgErr) {
                    console.error('⚠️ [Retell AI Background] Error sending locations email:', bgErr.message);
                }
            })();

            return;


        // 5. SOS Escalate / Roadside Mechanic Dispatch Action
        } else if (action === 'escalate_sos_mechanic' || action === 'sos_unresolved' || action === 'request_mechanic' || event === 'mechanic_requested') {
            console.log(`🚨 [Retell AI] Roadside Mechanic Dispatch requested by user for Booking: ${bookingId}`);
            const issueDetail = (body.args && (body.args.issue || body.args.notes || body.args.reason)) || 'Customer requested mechanic via AI Voice Call';

            const alertHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff5f5; border: 2px solid #e53e3e; border-radius: 8px;">
                    <h2 style="color: #c53030; margin-top: 0;">🚨 URGENT: Roadside Mechanic Dispatch (Via Retell AI Call)</h2>
                    <p>The customer indicated during the AI Emergency Call that their issue is <strong>UNSOLVED</strong> and requested roadside mechanic assistance.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr><td style="padding: 8px; font-weight: bold;">Booking ID:</td><td style="padding: 8px;">${bookingId || 'N/A'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Customer Name:</td><td style="padding: 8px;">${userName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Phone Number:</td><td style="padding: 8px;"><a href="tel:${userPhone}">${userPhone}</a></td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Vehicle:</td><td style="padding: 8px;">${vehicleName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">AI Diagnostic Note:</td><td style="padding: 8px; color: #c53030;"><strong>${issueDetail}</strong></td></tr>
                    </table>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="tel:${userPhone}" style="display: inline-block; padding: 12px 24px; background: #e53e3e; color: white; text-decoration: none; font-weight: bold; border-radius: 5px;">Call Customer Now</a>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    to: ADMIN_EMAILS,
                    subject: `🚨 [URGENT DISPATCH - RETELL CALL] Roadside Mechanic for Booking ${bookingId || 'N/A'}`,
                    html: alertHtml
                });
            } catch (mailErr) {
                console.error('Error sending Retell mechanic dispatch email:', mailErr.message);
            }

            return res.json({
                success: true,
                message: 'Roadside mechanic alert sent to emergency operations team. A representative will contact you immediately.',
                response: 'Emergency roadside mechanic alert register ho gaya hai. Hamari team aapse turant contact karegi.'
            });

        // 6. Fuel Leakage / High-Hazard Fire Alert
        } else if (action === 'fuel_leakage_alert' || action === 'fire_hazard') {
            console.log(`🔥 [Retell AI] FUEL LEAKAGE ALERT received for Booking: ${bookingId}`);
            try {
                await sendEmail({
                    to: ADMIN_EMAILS,
                    subject: `🔥 [HIGH HAZARD] Fuel Leakage Reported for Booking ${bookingId}`,
                    html: `<h3>URGENT FIRE HAZARD</h3><p>User ${userName} (${userPhone}) reported fuel leakage on vehicle ${vehicleName}. Immediate roadside emergency dispatch required.</p>`
                });
            } catch (err) {
                console.error('Error sending fuel leak alert email:', err.message);
            }

            return res.json({
                success: true,
                message: 'High priority hazard logged. Safety advice delivered to user.',
                response: 'Safety alert register ho gaya hai. Kripya vehicle se 10 meter door rahein.'
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


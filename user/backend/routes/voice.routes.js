const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const supabase = require('../config/supabase');
const { sendBookingConfirmationEmail, sendBookingCancelledEmail } = require('../config/emailService');

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

    const userEmail = req.query.userEmail || req.body.userEmail || 'your email';

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
        const metadata = callData.metadata || body.args || {};
        const bookingId = metadata.booking_id || metadata.bookingId;
        const userEmail = metadata.user_email || metadata.userEmail;
        const userName = metadata.user_name || metadata.userName || 'Customer';
        const vehicleName = metadata.vehicle_name || metadata.vehicleName || 'Vehicle';

        const action = body.name || (callData.custom_analysis_data && callData.custom_analysis_data.user_intent) || (body.args && body.args.action);

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

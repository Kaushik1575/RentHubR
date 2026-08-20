const supabase = require('../config/supabase');
const { sendSOSAlertEmail, sendEmail } = require('../config/emailService');
const { makeSOSOutboundCall } = require('../config/retellCallService');
const ADMIN_EMAILS = ['jyoti2006@gmail.com'];

const activateSOS = async (req, res) => {
    try {
        const { token, bookingId, gpsLocation } = req.body;

        // Basic validation
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Fetch booking details with user info
        let query = supabase.from('bookings').select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `);

        if (bookingId.toString().startsWith('RH')) {
            query = query.eq('booking_id', bookingId);
        } else {
            query = query.eq('id', bookingId);
        }

        const { data: booking, error: bookingError } = await query.single();

        if (bookingError || !booking) {
            console.error('Error fetching booking for SOS:', bookingError);
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Get vehicle details
        let vehicleName = 'Unknown Vehicle';

        console.log(`SOS Processing - ID: ${booking.id}, RH-ID: ${booking.booking_id}, Type: ${booking.vehicle_type}, VehicleID: ${booking.vehicle_id}`);

        // First, try to get vehicle name directly from booking if it exists
        if (booking.vehicle_name) {
            vehicleName = booking.vehicle_name;
        } else if (booking.vehicle_type && booking.vehicle_id) {
            // Determine correct table name
            let tableName;
            const typeLower = (booking.vehicle_type || '').toLowerCase().trim();

            if (typeLower === 'scooty') {
                tableName = 'scooty';
            } else if (typeLower === 'bike') {
                tableName = 'bikes';
            } else if (typeLower === 'car') {
                tableName = 'cars';
            } else {
                tableName = typeLower + 's';
            }

            const { data: vehicle, error: vehicleError } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', booking.vehicle_id)
                .single();

            if (vehicleError) {
                // Try alternative table name if first attempt fails
                if (tableName === 'scooty') {
                    const { data: altVehicle } = await supabase
                        .from('scooties')
                        .select('*')
                        .eq('id', booking.vehicle_id)
                        .single();
                    if (altVehicle) {
                        vehicleName = altVehicle.name || altVehicle.model || altVehicle.brand || 'Vehicle';
                    }
                }
            } else if (vehicle) {
                vehicleName = vehicle.name || vehicle.model || vehicle.brand || 'Vehicle';
            }
        }

        // Prepare SOS data
        let gpsString = 'Not Provided';
        let googleMapsLink = null;

        if (gpsLocation && typeof gpsLocation === 'object') {
            const { latitude, longitude, accuracy } = gpsLocation;
            gpsString = `Lat: ${latitude}, Lng: ${longitude} (Accuracy: ${accuracy}m)`;
            googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } else if (typeof gpsLocation === 'string') {
            gpsString = gpsLocation;
        }

        const userPhone = booking.users?.phone_number || booking.phone_number || null;
        const sosData = {
            bookingId: booking.booking_id || booking.id,
            userName: booking.users?.full_name || 'Unknown User',
            userEmail: booking.users?.email || 'Unknown Email',
            phoneNumber: userPhone || 'Unknown Phone',
            bikeModel: vehicleName,
            pickupLocation: booking.pickup_location || 'GITA Autonomous College BBSR',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            gpsLocation: gpsString,
            googleMapsLink: googleMapsLink
        };

        // Fetch all admins from database
        const { data: admins, error: adminError } = await supabase
            .from('users')
            .select('email')
            .eq('is_admin', true);

        // Always include the fallback admin email so the developer always receives it
        const allAdminEmails = new Set(ADMIN_EMAILS);

        if (adminError) {
            console.error('Error fetching admins:', adminError);
        } else if (admins && admins.length > 0) {
            admins.forEach(admin => {
                if (admin.email) allAdminEmails.add(admin.email);
            });
        } else {
            console.warn('No admins found in database. Using fallback.');
        }

        // 1. Send one email to all admins at once
        const allAdminEmailsArray = Array.from(allAdminEmails);
        await sendSOSAlertEmail(allAdminEmailsArray, sosData);

        // 2. Trigger Retell AI Automated Emergency Outbound Call to the User's Phone
        let callResult = { success: false };
        if (userPhone && userPhone !== 'Unknown Phone') {
            try {
                console.log(`🎙️ Initiating Retell AI Emergency Call to user ${userPhone} for booking ${sosData.bookingId}...`);
                callResult = await makeSOSOutboundCall(userPhone, sosData);
                console.log('📞 Retell AI SOS Call Response:', callResult);
            } catch (callErr) {
                console.error('⚠️ Retell AI SOS Call Failed:', callErr.message);
            }
        } else {
            console.warn('⚠️ No valid user phone number found for SOS voice call.');
        }

        res.json({
            success: true,
            message: 'SOS alert sent successfully. Emergency AI calling initiated.',
            callInitiated: callResult.success,
            callDetails: callResult,
            sosData: {
                bookingId: sosData.bookingId,
                userName: sosData.userName,
                phoneNumber: sosData.phoneNumber,
                bikeModel: sosData.bikeModel,
                googleMapsLink: sosData.googleMapsLink
            }
        });

    } catch (error) {
        console.error('Error processing SOS request:', error);
        res.status(500).json({ error: 'Internal server error processing SOS' });
    }
};

/**
 * Handle feedback from User / Retell AI when an SOS option is selected
 * (Option 1: Solved, Option 2: Escalate to Roadside Mechanic)
 */
const handleSOSFeedback = async (req, res) => {
    try {
        const { bookingId, status, issueType, details } = req.body;

        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        console.log(`🚨 SOS Feedback Received - Booking: ${bookingId}, Status: ${status}, Issue: ${issueType}`);

        if (status === 'escalate_mechanic' || status === 'unresolved') {
            // Fetch booking details for escalation
            let query = supabase.from('bookings').select('*, users:user_id(full_name, email, phone_number)');
            if (bookingId.toString().startsWith('RH')) {
                query = query.eq('booking_id', bookingId);
            } else {
                query = query.eq('id', bookingId);
            }
            const { data: booking } = await query.single();

            const userName = booking?.users?.full_name || 'Customer';
            const userPhone = booking?.users?.phone_number || 'N/A';
            const vehicleName = booking?.vehicle_name || 'Vehicle';

            // Send high-priority mechanic dispatch alert email
            const alertHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff5f5; border: 2px solid #e53e3e; border-radius: 8px;">
                    <h2 style="color: #c53030; margin-top: 0;">🚨 URGENT: Roadside Mechanic Dispatch Requested!</h2>
                    <p>A customer has indicated that their issue is <strong>UNSOLVED</strong> and requested emergency roadside mechanic assistance.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr><td style="padding: 8px; font-weight: bold;">Booking ID:</td><td style="padding: 8px;">${bookingId}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Customer Name:</td><td style="padding: 8px;">${userName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Phone Number:</td><td style="padding: 8px;"><a href="tel:${userPhone}">${userPhone}</a></td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Vehicle:</td><td style="padding: 8px;">${vehicleName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Reported Issue:</td><td style="padding: 8px; color: #c53030;"><strong>${issueType || 'General Breakdown'}</strong></td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">Details / Notes:</td><td style="padding: 8px;">${details || 'Customer requested mechanic via AI SOS Voice flow'}</td></tr>
                    </table>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="tel:${userPhone}" style="display: inline-block; padding: 12px 24px; background: #e53e3e; color: white; text-decoration: none; font-weight: bold; border-radius: 5px;">Call Customer Immediately</a>
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    to: ADMIN_EMAILS,
                    subject: `🚨 [URGENT DISPATCH] Roadside Mechanic Needed - Booking ${bookingId}`,
                    html: alertHtml
                });
                console.log(`✉️ Emergency Mechanic Dispatch alert sent to admins for booking ${bookingId}`);
            } catch (emailErr) {
                console.error('Error sending mechanic alert email:', emailErr.message);
            }

            return res.json({
                success: true,
                message: 'Roadside mechanic dispatch request escalated to emergency response team.',
                status: 'mechanic_dispatched'
            });
        }

        // If status is 'resolved'
        console.log(`✅ SOS Marked as Resolved for booking ${bookingId}`);
        return res.json({
            success: true,
            message: 'SOS issue marked as resolved. Safe travels!',
            status: 'resolved'
        });

    } catch (error) {
        console.error('Error handling SOS feedback:', error);
        res.status(500).json({ error: 'Failed to process SOS feedback: ' + error.message });
    }
};

module.exports = {
    activateSOS,
    handleSOSFeedback
};

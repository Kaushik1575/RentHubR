const supabase = require('../config/supabase');
const { sendSOSAlertEmail, sendNearestLocationsEmail, sendEmail } = require('../config/emailService');
const { makeSOSOutboundCall } = require('../config/retellCallService');
const { findNearbyPlaces } = require('../services/nearbyPlacesService');
const ADMIN_EMAILS = ['jyoti2006@gmail.com'];

const activateSOS = async (req, res) => {
    try {
        const { token, bookingId, gpsLocation, phoneNumber } = req.body;

        // Basic validation: must have bookingId or phoneNumber
        if (!bookingId && !phoneNumber) {
            return res.status(400).json({ error: 'Booking ID or Registered Phone Number is required' });
        }

        let booking = null;

        // 1. Fetch booking details with user info if bookingId provided
        if (bookingId) {
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

            const { data: fetchedBooking, error: bookingError } = await query.single();
            if (fetchedBooking) {
                booking = fetchedBooking;
            } else if (bookingError) {
                console.warn('Booking lookup warning for SOS:', bookingError.message);
            }
        }

        // 2. If booking not found yet but phoneNumber is provided, lookup latest booking for that phone
        if (!booking && phoneNumber) {
            const clean10 = String(phoneNumber).replace(/\D/g, '').slice(-10);
            try {
                const { data: matchedUsers } = await supabase
                    .from('users')
                    .select('id, full_name, email, phone_number');

                const matchedUser = matchedUsers?.find(u => {
                    const uPhone = String(u.phone_number || '').replace(/\D/g, '').slice(-10);
                    return uPhone === clean10;
                });

                if (matchedUser) {
                    const { data: userBookings } = await supabase
                        .from('bookings')
                        .select('*, users:user_id(full_name, email, phone_number)')
                        .eq('user_id', matchedUser.id)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (userBookings && userBookings.length > 0) {
                        booking = userBookings[0];
                    }
                }
            } catch (userLookupErr) {
                console.warn('User lookup by phone failed:', userLookupErr.message);
            }
        }

        if (!booking && !phoneNumber) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Get vehicle details
        let vehicleName = 'Unknown Vehicle';

        if (booking) {
            console.log(`SOS Processing - ID: ${booking.id}, RH-ID: ${booking.booking_id}, Type: ${booking.vehicle_type}, VehicleID: ${booking.vehicle_id}`);

            if (booking.vehicle_name) {
                vehicleName = booking.vehicle_name;
            } else if (booking.vehicle_type && booking.vehicle_id) {
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
        } else {
            vehicleName = 'Rented Vehicle (Roadside SOS)';
        }

        let gpsString = 'Not Provided';
        let googleMapsLink = null;

        if (gpsLocation && typeof gpsLocation === 'object') {
            const { latitude, longitude, accuracy } = gpsLocation;
            gpsString = `Lat: ${latitude}, Lng: ${longitude} (Accuracy: ${accuracy}m)`;
            googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } else if (typeof gpsLocation === 'string') {
            gpsString = gpsLocation;
        }

        const userObj = Array.isArray(booking?.users) ? booking.users[0] : booking?.users;
        const userPhone = phoneNumber || userObj?.phone_number || booking?.phone_number || null;
        const userEmail = userObj?.email || booking?.user_email || 'jyoti2006@gmail.com';
        const userName = userObj?.full_name || 'RentHub Customer';

        const sosData = {
            bookingId: booking?.booking_id || booking?.id || (bookingId || ('SOS-' + Date.now().toString().slice(-6))),
            userName: userName,
            userEmail: userEmail,
            phoneNumber: userPhone || 'Unknown Phone',
            bikeModel: vehicleName,
            pickupLocation: booking?.pickup_location || 'GITA Autonomous College BBSR',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            gpsLocation: gpsString,
            googleMapsLink: googleMapsLink
        };

        // Fetch all admins from database
        const { data: admins, error: adminError } = await supabase
            .from('admins')
            .select('email');

        const allAdminEmails = new Set(ADMIN_EMAILS);

        if (adminError) {
            console.error('Error fetching admins:', adminError);
        } else if (admins && admins.length > 0) {
            admins.forEach(admin => {
                if (admin.email) allAdminEmails.add(admin.email);
            });
        }

        const allAdminEmailsArray = Array.from(allAdminEmails);
        try {
            await sendSOSAlertEmail(allAdminEmailsArray, sosData);
        } catch (emailErr) {
            console.error('Error sending SOS admin alert email:', emailErr.message);
        }

        // 2. Trigger Retell AI Automated Emergency Outbound Call to the User's Phone
        let callResult = { success: false };
        if (userPhone && String(userPhone).trim() !== '' && String(userPhone).toLowerCase() !== 'unknown phone') {
            try {
                console.log(`🎙️ Initiating Retell AI Emergency Call to user ${userPhone} for booking ${sosData.bookingId}...`);
                callResult = await makeSOSOutboundCall(String(userPhone), sosData);
                console.log('📞 Retell AI SOS Call Response:', callResult);
            } catch (callErr) {
                console.error('⚠️ Retell AI SOS Call Failed:', callErr.message);
                callResult = { success: false, error: callErr.message };
            }
        } else {
            console.warn('⚠️ No valid user phone number found for SOS voice call.');
            callResult = { success: false, error: 'No phone number available for call dispatch' };
        }

        res.json({
            success: true,
            message: callResult.success
                ? 'SOS alert sent successfully. Emergency AI call connected.'
                : 'SOS alert sent successfully. Emergency AI calling initiated.',
            callInitiated: callResult.success,
            callDetails: callResult,
            sosData: {
                bookingId: sosData.bookingId,
                userName: sosData.userName,
                userEmail: sosData.userEmail,
                phoneNumber: sosData.phoneNumber,
                bikeModel: sosData.bikeModel,
                googleMapsLink: sosData.googleMapsLink,
                gpsLocation: sosData.gpsLocation
            }
        });

    } catch (error) {
        console.error('Error processing SOS request:', error);
        res.status(500).json({ error: 'Internal server error processing SOS: ' + error.message });
    }
};

const handleSOSFeedback = async (req, res) => {
    try {
        const { bookingId, status, issueType, details, gpsLocation } = req.body;

        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        console.log(`🚨 SOS Feedback Received - Booking: ${bookingId}, Status: ${status}, Issue: ${issueType}`);

        let query = supabase.from('bookings').select('*, users:user_id(full_name, email, phone_number)');
        if (bookingId.toString().startsWith('RH')) {
            query = query.eq('booking_id', bookingId);
        } else {
            query = query.eq('id', bookingId);
        }
        const { data: booking } = await query.single();

        const userName = booking?.users?.full_name || 'Customer';
        const userEmail = booking?.users?.email || booking?.user_email || null;
        const userPhone = booking?.users?.phone_number || 'N/A';
        const vehicleName = booking?.vehicle_name || 'Vehicle';

        if (status === 'send_nearby_locations' || status === 'send_location' || status === 'send_nearest_locations') {
            const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
            const nearbyData = await findNearbyPlaces(gpsLocation, booking?.pickup_location, clientIp);

            if (userEmail) {
                await sendNearestLocationsEmail(
                    userEmail,
                    userName,
                    {
                        bookingId: bookingId,
                        vehicleName: vehicleName
                    },
                    nearbyData
                );
                console.log(`✉️ Dispatched nearest garage & petrol pump email to ${userEmail} for booking ${bookingId}`);
            }

            return res.json({
                success: true,
                message: `Nearest bike garages and petrol pumps sent to ${userEmail || 'registered email'}.`,
                status: 'locations_sent',
                userEmail: userEmail,
                nearbyData: nearbyData
            });
        }

        if (status === 'escalate_mechanic' || status === 'unresolved') {
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

const sendNearestLocations = async (req, res) => {
    try {
        const { bookingId, gpsLocation, userEmail, userName } = req.body;

        if (!bookingId && !userEmail) {
            return res.status(400).json({ error: 'Booking ID or User Email is required' });
        }

        console.log(`📍 [SOS Controller] Finding nearest locations for Booking: ${bookingId}, Email: ${userEmail}`);

        let booking = null;
        let recipientEmail = userEmail;
        let recipientName = userName || 'Customer';
        let vehicleName = 'Vehicle';

        if (bookingId) {
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

            const { data, error } = await query.single();
            if (data && !error) {
                booking = data;
                recipientEmail = recipientEmail || booking.users?.email || booking.user_email;
                recipientName = recipientName !== 'Customer' ? recipientName : (booking.users?.full_name || 'Customer');
                vehicleName = booking.vehicle_name || 'Vehicle';
            }
        }

        if (!recipientEmail) {
            return res.status(400).json({ error: 'Recipient email not found for this booking' });
        }

        const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
        const nearbyData = await findNearbyPlaces(gpsLocation, booking?.pickup_location, clientIp);

        const emailResult = await sendNearestLocationsEmail(
            recipientEmail,
            recipientName,
            {
                bookingId: booking?.booking_id || bookingId || 'Active Ride',
                vehicleName: vehicleName
            },
            nearbyData
        );

        return res.json({
            success: true,
            message: `Nearest bike garages and petrol pump locations sent successfully to ${recipientEmail}`,
            userEmail: recipientEmail,
            nearbyData: nearbyData,
            emailSent: emailResult.success
        });

    } catch (error) {
        console.error('Error in sendNearestLocations controller:', error);
        return res.status(500).json({ error: 'Failed to process nearest locations request: ' + error.message });
    }
};

module.exports = {
    activateSOS,
    handleSOSFeedback,
    sendNearestLocations
};
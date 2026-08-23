const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../user/backend/.env') });
const supabase = require('../user/backend/config/supabase');

async function inspectLatestBookings() {
    console.log('Querying latest 5 bookings from Supabase...');
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching bookings:', error);
        return;
    }

    console.log(`Found ${bookings.length} recent bookings:`);
    bookings.forEach((b, i) => {
        console.log(`\n--- Booking #${i+1} ---`);
        console.log(`ID: ${b.id} | BookingID: ${b.booking_id}`);
        console.log(`Pickup Location: "${b.pickup_location}"`);
        console.log(`Live Location / GPS: "${b.gps_location || b.live_location || b.location || 'N/A'}"`);
        console.log(`User Email: ${b.user_email}`);
        console.log(`Phone: ${b.phone_number}`);
        console.log(`Vehicle: ${b.vehicle_name || b.vehicle_type}`);
    });
}

inspectLatestBookings().catch(console.error);

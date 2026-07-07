const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllStatuses() {
    console.log("=== Checking Honda Hornet with ALL statuses ===\n");

    // Check bookings with different status columns and values
    const { data: bookings1 } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', 11)
        .eq('vehicle_type', 'bike');

    console.log(`Bookings with vehicle_id=11 (any status): ${bookings1?.length || 0}`);

    if (bookings1 && bookings1.length > 0) {
        bookings1.forEach(b => {
            console.log(`  - ID: ${b.id}, Status: ${b.status}, Booking_Status: ${b.booking_status}, Price: ₹${b.total_price || b.total_amount}`);
        });
    }

    // Check with status IN clause
    const { data: bookings2 } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', 11)
        .in('status', ['completed', 'ride_completed', 'ride_ended', 'payment_success']);

    console.log(`\nBookings with completion statuses: ${bookings2?.length || 0}`);

    if (bookings2 && bookings2.length > 0) {
        bookings2.forEach(b => {
            console.log(`  - ID: ${b.id}, Status: ${b.status}, Price: ₹${b.total_price || b.total_amount}, Duration: ${b.duration}h`);
        });
    }
}

checkAllStatuses();

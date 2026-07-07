const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugBookingFields() {
    console.log("=== Checking Booking Table Structure ===\n");

    // Get one booking to see all fields
    const { data: sample } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);

    if (sample && sample.length > 0) {
        console.log("Sample booking fields:");
        console.log(JSON.stringify(sample[0], null, 2));
    }

    // Check Honda Hornet booking specifically
    const { data: hornetBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', 11);

    console.log(`\n\n=== Honda Hornet (ID: 11) Bookings ===`);
    console.log(`Total: ${hornetBooking?.length || 0}\n`);

    if (hornetBooking && hornetBooking.length > 0) {
        hornetBooking.forEach(b => {
            console.log(`Booking ID: ${b.id}`);
            console.log(`  vehicle_id: ${b.vehicle_id}`);
            console.log(`  vehicle_type: ${b.vehicle_type}`);
            console.log(`  status: ${b.status}`);
            console.log(`  booking_status: ${b.booking_status}`);
            console.log(`  total_price: ${b.total_price}`);
            console.log(`  total_amount: ${b.total_amount}`);
            console.log(`  duration: ${b.duration}`);
            console.log(`  ride_duration: ${b.ride_duration}`);
            console.log('---');
        });
    }
}

debugBookingFields();

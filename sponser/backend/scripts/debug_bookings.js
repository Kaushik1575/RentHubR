const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugBookings() {
    console.log("=== Checking Bookings Data ===\n");

    // 1. Check if bookings table exists and has data
    const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(5);

    if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError.message);
        return;
    }

    console.log(`Total bookings (sample): ${allBookings?.length || 0}`);
    if (allBookings && allBookings.length > 0) {
        console.log("\nSample booking:");
        console.log(JSON.stringify(allBookings[0], null, 2));
    }

    // 2. Check completed bookings
    const { data: completedBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_status', 'completed');

    console.log(`\nCompleted bookings: ${completedBookings?.length || 0}`);

    // 3. Check all booking statuses
    const { data: allStatuses } = await supabase
        .from('bookings')
        .select('booking_status');

    const statusCounts = {};
    allStatuses?.forEach(b => {
        statusCounts[b.booking_status] = (statusCounts[b.booking_status] || 0) + 1;
    });

    console.log("\nBooking status breakdown:");
    console.log(JSON.stringify(statusCounts, null, 2));

    // 4. Check for specific sponsor
    const targetEmail = 'dask64576@gmail.com';
    const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('email', targetEmail)
        .single();

    if (sponsor) {
        console.log(`\n=== Checking vehicles for ${targetEmail} ===`);

        // Get their vehicles
        const { data: bikes } = await supabase
            .from('bikes')
            .select('id, name')
            .eq('sponsor_id', sponsor.id);

        console.log(`Bikes owned: ${bikes?.length || 0}`);
        if (bikes && bikes.length > 0) {
            console.log("Bike IDs:", bikes.map(b => b.id));

            // Check bookings for these bikes
            const bikeIds = bikes.map(b => b.id);
            const { data: bikeBookings } = await supabase
                .from('bookings')
                .select('*')
                .eq('vehicle_type', 'bike')
                .in('vehicle_id', bikeIds);

            console.log(`\nBookings for these bikes: ${bikeBookings?.length || 0}`);
            if (bikeBookings && bikeBookings.length > 0) {
                console.log("Sample booking for sponsor's bike:");
                console.log(JSON.stringify(bikeBookings[0], null, 2));
            }
        }
    }
}

debugBookings();

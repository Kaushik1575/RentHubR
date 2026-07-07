const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jxgzgpqjypvrrmwxcbvv.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseKaushik() {
    console.log('=== Diagnosing Kaushik Das Income ===');

    // 1. Find Kaushik
    const { data: sponsors, error: sponsorError } = await supabase
        .from('sponsors')
        .select('*')
        .ilike('email', '%dask64576%');

    if (sponsorError || !sponsors || sponsors.length === 0) {
        console.error('Kaushik Das not found using email pattern dask64576');
        return;
    }

    const kaushik = sponsors[0];
    console.log(`Found Sponsor: ${kaushik.full_name} (${kaushik.email})`);
    console.log(`ID: ${kaushik.id}`);

    // 2. Find Vehicles
    const { data: bikes } = await supabase.from('bikes').select('*').eq('sponsor_id', kaushik.id);
    const { data: cars } = await supabase.from('cars').select('*').eq('sponsor_id', kaushik.id);
    const { data: scooty } = await supabase.from('scooty').select('*').eq('sponsor_id', kaushik.id);

    const allVehicles = [
        ...(bikes || []).map(v => ({ ...v, type: 'bike' })),
        ...(cars || []).map(v => ({ ...v, type: 'car' })),
        ...(scooty || []).map(v => ({ ...v, type: 'scooty' }))
    ];

    console.log(`\nVehicles Owned: ${allVehicles.length}`);
    if (allVehicles.length === 0) {
        console.log('❌ No vehicles found for this sponsor!');
        const { data: allBikes } = await supabase.from('bikes').select('id, name, sponsor_id').limit(5);
        console.log('Sample bikes in DB:', allBikes);
        return;
    }

    allVehicles.forEach(v => {
        console.log(`- [${v.type}] ${v.name} (ID: ${v.id})`);
    });

    const vehicleIds = allVehicles.map(v => v.id);

    // 3. Find Bookings for these vehicles
    // Note: checking if vehicle_id is in the list
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .in('vehicle_id', vehicleIds);

    if (bookingError) {
        console.error('Error fetching bookings:', bookingError);
        return;
    }

    console.log(`\nTotal Bookings Found for these vehicles: ${bookings?.length || 0}`);

    if (bookings && bookings.length > 0) {
        bookings.forEach(b => {
            console.log(`  - Booking ID: ${b.booking_id || b.id}`);
            console.log(`    Vehicle ID: ${b.vehicle_id}`);
            console.log(`    Status: ${b.status}`);
            console.log(`    Amount: ${b.total_amount}`);
            console.log(`    Type in Booking: ${b.vehicle_type}`);

            const isCompleted = ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status);
            console.log(`    -> counted as revenue? ${isCompleted ? 'YES' : 'NO'}`);
        });

        // Calculate expected revenue
        const revenue = bookings
            .filter(b => ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status))
            .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

        console.log(`\nExpected Revenue for Kaushik: ${revenue}`);
    } else {
        console.log('No bookings found for any of Kaushik\'s vehicles.');
    }

}

diagnoseKaushik();

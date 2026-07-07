const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findHondaHornet() {
    console.log("=== Finding Honda Hornet ===\n");

    const targetEmail = 'dask64576@gmail.com';

    // Get sponsor
    const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('email', targetEmail)
        .single();

    if (!sponsor) {
        console.log("Sponsor not found");
        return;
    }

    console.log(`Sponsor ID: ${sponsor.id}\n`);

    // Search for Honda Hornet in all tables
    const { data: bikes } = await supabase
        .from('bikes')
        .select('*')
        .ilike('name', '%honda%hornet%');

    console.log(`Found ${bikes?.length || 0} Honda Hornet in bikes table:`);
    bikes?.forEach(b => {
        console.log(`  - ID: ${b.id}, Name: ${b.name}, Sponsor: ${b.sponsor_id}, Available: ${b.is_available}`);
    });

    // Check if any belong to this sponsor
    const sponsorHornet = bikes?.find(b => b.sponsor_id === sponsor.id);

    if (sponsorHornet) {
        console.log(`\n✅ Honda Hornet belongs to sponsor!`);
        console.log(`Vehicle ID: ${sponsorHornet.id}`);

        // Check bookings for this specific vehicle
        const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('vehicle_id', sponsorHornet.id)
            .eq('vehicle_type', 'bike');

        console.log(`\nBookings for Honda Hornet (ID: ${sponsorHornet.id}):`);
        console.log(`Total: ${bookings?.length || 0}`);

        if (bookings && bookings.length > 0) {
            bookings.forEach(b => {
                console.log(`  - Booking #${b.id}: Status=${b.booking_status}, Price=₹${b.total_price}, Duration=${b.duration}h`);
            });

            // Calculate stats
            const completed = bookings.filter(b => b.booking_status === 'completed');
            const totalRevenue = completed.reduce((sum, b) => sum + (b.total_price || 0), 0);
            const totalHours = completed.reduce((sum, b) => sum + (b.duration || 0), 0);

            console.log(`\nCompleted bookings: ${completed.length}`);
            console.log(`Total Revenue: ₹${totalRevenue}`);
            console.log(`Total Hours: ${totalHours}h`);
        }
    } else {
        console.log(`\n❌ Honda Hornet does NOT belong to this sponsor`);
        if (bikes && bikes.length > 0) {
            console.log(`It belongs to sponsor ID: ${bikes[0].sponsor_id}`);
        }
    }
}

findHondaHornet();

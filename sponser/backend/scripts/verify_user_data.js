require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSponsorData() {
    const email = 'dask64576@gmail.com';

    // 1. Get Sponsor ID
    const { data: sponsor } = await supabase.from('sponsors').select('id').eq('email', email).single();
    if (!sponsor) {
        console.log('Sponsor not found');
        return;
    }
    console.log(`Sponsor ID: ${sponsor.id}`);

    // 2. Get Vehicles
    const [bikes, cars, scooty] = await Promise.all([
        supabase.from('bikes').select('id').eq('sponsor_id', sponsor.id),
        supabase.from('cars').select('id').eq('sponsor_id', sponsor.id),
        supabase.from('scooty').select('id').eq('sponsor_id', sponsor.id)
    ]);

    const vehicleIds = [
        ...bikes.data.map(v => v.id),
        ...cars.data.map(v => v.id),
        ...scooty.data.map(v => v.id)
    ];
    console.log(`Vehicle IDs: ${vehicleIds.join(', ')}`);

    // 3. Get Bookings in 2026
    const { data: bookings } = await supabase
        .from('bookings')
        .select('id, created_at, status, total_amount')
        .in('vehicle_id', vehicleIds)
        .gte('created_at', '2026-01-01T00:00:00Z')
        .lt('created_at', '2027-01-01T00:00:00Z');

    console.log(`\nTotal Bookings in 2026: ${bookings.length}`);

    const janBookings = bookings.filter(b => new Date(b.created_at).getMonth() === 0);
    const febBookings = bookings.filter(b => new Date(b.created_at).getMonth() === 1);

    console.log(`Jan 2026: ${janBookings.length} bookings`);
    janBookings.forEach(b => console.log(` - #${b.id} ${b.status} ₹${b.total_amount} (${b.created_at})`));

    console.log(`Feb 2026: ${febBookings.length} bookings`);
    febBookings.forEach(b => console.log(` - #${b.id} ${b.status} ₹${b.total_amount} (${b.created_at})`));
}

checkSponsorData();

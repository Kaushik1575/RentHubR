const supabase = require('../config/supabase');

async function debugBookingCount() {
    console.log('🔍 Debugging booking count discrepancy...\n');

    // Get Kaushik Das's sponsor ID
    const { data: sponsors } = await supabase
        .from('sponsors')
        .select('id, full_name, email')
        .ilike('full_name', '%kaushik%');

    if (!sponsors || sponsors.length === 0) {
        console.log('❌ Kaushik Das not found in sponsors table');
        return;
    }

    const sponsor = sponsors[0];
    console.log(`✅ Found sponsor: ${sponsor.full_name} (ID: ${sponsor.id})`);
    console.log(`   Email: ${sponsor.email}\n`);

    // Get their vehicles
    const [bikes, cars, scooty] = await Promise.all([
        supabase.from('bikes').select('*').eq('sponsor_id', sponsor.id),
        supabase.from('cars').select('*').eq('sponsor_id', sponsor.id),
        supabase.from('scooty').select('*').eq('sponsor_id', sponsor.id)
    ]);

    const allVehicles = [
        ...(bikes.data || []).map(v => ({ ...v, type: 'bike' })),
        ...(cars.data || []).map(v => ({ ...v, type: 'car' })),
        ...(scooty.data || []).map(v => ({ ...v, type: 'scooty' }))
    ];

    console.log(`📊 Total Vehicles: ${allVehicles.length}`);
    allVehicles.forEach(v => {
        console.log(`   - ${v.name} (${v.type}, ID: ${v.id})`);
    });

    const vehicleIds = allVehicles.map(v => v.id);

    if (vehicleIds.length === 0) {
        console.log('❌ No vehicles found for this sponsor');
        return;
    }

    // Fetch ALL bookings for these vehicles
    const { data: allBookings } = await supabase
        .from('bookings')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false });

    console.log(`\n📦 Total Bookings (all statuses): ${allBookings?.length || 0}`);

    // Group by status
    const byStatus = {};
    (allBookings || []).forEach(b => {
        const status = b.status || 'unknown';
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(b);
    });

    console.log('\n📊 Bookings by Status:');
    Object.keys(byStatus).sort().forEach(status => {
        console.log(`   ${status}: ${byStatus[status].length}`);
        byStatus[status].forEach(b => {
            console.log(`      - Booking ${b.booking_id || b.id} | Vehicle: ${b.vehicle_id} (${b.vehicle_type}) | Amount: ₹${b.total_amount}`);
        });
    });

    // Count completed bookings (what reports should show)
    const completedStatuses = ['completed', 'ride_completed', 'ride_ended', 'payment_success'];
    const completedBookings = (allBookings || []).filter(b =>
        completedStatuses.includes(b.status)
    );

    console.log(`\n✅ Completed Bookings (for reports): ${completedBookings.length}`);
    console.log('   Statuses counted:', completedStatuses.join(', '));

    // Check for potential mismatches
    console.log('\n🔎 Checking for vehicle_type mismatches...');
    allBookings.forEach(b => {
        const vehicle = allVehicles.find(v => v.id === b.vehicle_id);
        if (vehicle && vehicle.type !== b.vehicle_type) {
            console.log(`   ⚠️  Mismatch: Booking ${b.booking_id || b.id}`);
            console.log(`      Vehicle DB type: ${vehicle.type}`);
            console.log(`      Booking type: ${b.vehicle_type}`);
        }
    });

    console.log('\n✅ Debug complete!');
}

debugBookingCount().catch(console.error).finally(() => process.exit());

const supabase = require('../config/supabase');
const SponsorModel = require('../models/sponsorModel');

async function debugCurrentState() {
    console.log('🔍 Checking current state of data...\n');

    try {
        // Get Kaushik Das
        const { data: kaushik } = await supabase
            .from('sponsors')
            .select('*')
            .ilike('full_name', '%kaushik%')
            .single();

        if (!kaushik) {
            console.log('❌ Kaushik not found');
            return;
        }

        console.log(`✅ Testing for: ${kaushik.full_name}`);
        console.log(`   ID: ${kaushik.id}\n`);

        // Test Admin Report Function
        console.log('📊 Admin Report (getSponsorEarningsReport):');
        const adminReport = await SponsorModel.getSponsorEarningsReport();
        const adminEntry = adminReport.find(r => r.id === kaushik.id);

        if (adminEntry) {
            console.log(`   Bookings: ${adminEntry.bookings}`);
            console.log(`   Revenue: ₹${adminEntry.revenue}`);
            console.log(`   Vehicles: ${adminEntry.vehicleCount}`);
        } else {
            console.log('   ❌ Not found in report');
        }

        // Test Dashboard Function
        console.log('\n📊 Dashboard (getDetailedRevenueStats):');
        const dashStats = await SponsorModel.getDetailedRevenueStats(kaushik.id);
        console.log(`   Bookings: ${dashStats.transactions.length}`);
        console.log(`   Revenue: ₹${dashStats.grossRevenue}`);
        console.log(`   Vehicles: ${dashStats.vehicleStats.length}`);

        // Comparison
        console.log('\n🔍 RESULT:');
        if (adminEntry && adminEntry.bookings === dashStats.transactions.length) {
            console.log(`   ✅ MATCH! Both show ${adminEntry.bookings} bookings`);
        } else {
            console.log(`   ❌ MISMATCH!`);
            console.log(`   Admin: ${adminEntry?.bookings || 'N/A'}`);
            console.log(`   Dashboard: ${dashStats.transactions.length}`);
        }

        // Check vehicle types in bookings
        console.log('\n🔍 Checking vehicle_type values in database:');
        const { data: bookings } = await supabase
            .from('bookings')
            .select('vehicle_type')
            .limit(100);

        const types = {};
        bookings.forEach(b => {
            const t = b.vehicle_type || 'null';
            types[t] = (types[t] || 0) + 1;
        });

        Object.keys(types).sort().forEach(t => {
            const status = ['bikes', 'cars', 'scooters'].includes(t) ? '❌ PLURAL' : '✅';
            console.log(`   ${status} ${t}: ${types[t]}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugCurrentState().then(() => process.exit());

const supabase = require('../config/supabase');
const SponsorModel = require('../models/sponsorModel');

async function debugJyotiRanjan() {
    console.log('🔍 Debugging data for jyotiranjansahoo485@gmail.com\n');

    try {
        // Get sponsor info
        const { data: sponsor, error: sError } = await supabase
            .from('sponsors')
            .select('*')
            .eq('email', 'jyotiranjansahoo485@gmail.com')
            .single();

        if (sError || !sponsor) {
            console.log('❌ Sponsor not found:', sError?.message);
            return;
        }

        console.log(`✅ Found: ${sponsor.full_name}`);
        console.log(`   ID: ${sponsor.id}`);
        console.log(`   Email: ${sponsor.email}\n`);

        // Get vehicles
        const vehicles = await SponsorModel.getSponsorVehicles(sponsor.id);
        console.log(`📦 Total Vehicles: ${vehicles.length}`);
        vehicles.forEach(v => {
            console.log(`   - ${v.name || v.registration_number} (${v.type}, ID: ${v.id}, Status: ${v.status})`);
        });

        // Get vehicle IDs
        const approvedVehicles = vehicles.filter(v => v.status === 'approved');
        const vehicleIds = approvedVehicles.map(v => v.id);

        console.log(`\n✅ Approved Vehicles: ${approvedVehicles.length}`);

        if (vehicleIds.length === 0) {
            console.log('⚠️  No approved vehicles - cannot have bookings\n');
        }

        // === METHOD 1: Admin Report ===
        console.log('\n📊 METHOD 1: Admin Report (getSponsorEarningsReport)');
        const adminReport = await SponsorModel.getSponsorEarningsReport();
        const adminEntry = adminReport.find(r => r.id === sponsor.id);

        if (adminEntry) {
            console.log(`   Bookings: ${adminEntry.bookings}`);
            console.log(`   Revenue: ₹${adminEntry.revenue}`);
            console.log(`   Sponsor Share (70%): ₹${adminEntry.revenue * 0.7}`);
            console.log(`   Withdrawn: ₹${adminEntry.withdrawn}`);
            console.log(`   Balance: ₹${(adminEntry.revenue * 0.7) - adminEntry.withdrawn}`);
            console.log(`   Vehicles: ${adminEntry.vehicleCount}`);
        } else {
            console.log('   ❌ Not found in admin report');
        }

        // === METHOD 2: Dashboard Stats ===
        console.log('\n📊 METHOD 2: Dashboard (getDetailedRevenueStats)');
        const dashStats = await SponsorModel.getDetailedRevenueStats(sponsor.id);
        console.log(`   Bookings: ${dashStats.transactions.length}`);
        console.log(`   Revenue: ₹${dashStats.grossRevenue}`);
        console.log(`   Net Earnings (70%): ₹${dashStats.grossRevenue * 0.7}`);
        console.log(`   Vehicles: ${dashStats.vehicleStats.length}`);

        // === DETAILED BOOKING CHECK ===
        if (vehicleIds.length > 0) {
            console.log('\n🔍 Detailed Booking Check:');
            const { data: allBookings } = await supabase
                .from('bookings')
                .select('*')
                .in('vehicle_id', vehicleIds)
                .order('created_at', { ascending: false });

            console.log(`   Total bookings for these vehicles: ${allBookings?.length || 0}`);

            const byStatus = {};
            (allBookings || []).forEach(b => {
                const s = b.status || 'unknown';
                if (!byStatus[s]) byStatus[s] = [];
                byStatus[s].push(b);
            });

            console.log('\n   By Status:');
            Object.keys(byStatus).sort().forEach(status => {
                const isCompleted = ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(status);
                const marker = isCompleted ? '✅' : '⏸️';
                console.log(`   ${marker} ${status}: ${byStatus[status].length}`);
            });

            const completedBookings = (allBookings || []).filter(b =>
                ['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status)
            );

            console.log(`\n   ✅ Completed bookings (should be counted): ${completedBookings.length}`);

            if (completedBookings.length > 0) {
                console.log('\n   Completed booking details:');
                completedBookings.forEach(b => {
                    console.log(`      - ${b.booking_id || b.id}: ₹${b.total_amount} (Vehicle ${b.vehicle_id}, Type: ${b.vehicle_type})`);
                });
            }
        }

        // === COMPARISON ===
        console.log('\n🔍 COMPARISON:');
        console.log(`   Admin Panel Bookings: ${adminEntry ? adminEntry.bookings : 'N/A'}`);
        console.log(`   Sponsor Dashboard Bookings: ${dashStats.transactions.length}`);

        if (adminEntry && adminEntry.bookings === dashStats.transactions.length) {
            console.log('\n   ✅ MATCH! Both show the same data');
        } else {
            console.log('\n   ❌ MISMATCH DETECTED!');
            console.log(`   Difference: ${Math.abs((adminEntry?.bookings || 0) - dashStats.transactions.length)} bookings`);

            if ((adminEntry?.bookings || 0) > dashStats.transactions.length) {
                console.log('   Admin panel is showing MORE bookings than dashboard');
            } else {
                console.log('   Dashboard is showing MORE bookings than admin panel');
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

debugJyotiRanjan().then(() => process.exit());

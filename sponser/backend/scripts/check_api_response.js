const supabase = require('../config/supabase');

async function checkAPIEndpoint() {
    console.log('🔍 Checking what the API endpoint actually returns...\n');

    try {
        // This mimics what the frontend calls
        const fetch = require('node-fetch');

        const response = await fetch('http://localhost:3005/api/sponsor/earnings-report');
        const data = await response.json();

        console.log('📊 API Response Structure:');
        console.log(`   Total sponsors in report: ${data.report?.length || 0}\n`);

        // Find Jyoti Ranjan
        const jyoti = data.report?.find(r =>
            r.email === 'jyotiranjansahoo485@gmail.com' ||
            r.name?.toLowerCase().includes('jyoti')
        );

        if (jyoti) {
            console.log('✅ Found Jyoti Ranjan in API response:');
            console.log(`   Name: ${jyoti.name}`);
            console.log(`   Email: ${jyoti.email}`);
            console.log(`   Vehicles: ${jyoti.vehicleCount}`);
            console.log(`   Bookings: ${jyoti.bookings}`);
            console.log(`   Total Revenue: ₹${jyoti.totalRevenue}`);
            console.log(`   Sponsor Share: ₹${jyoti.sponsorShare}`);
            console.log(`   Platform Fee: ₹${jyoti.platformFee}`);
            console.log(`   Balance: ₹${jyoti.balance}`);

            console.log('\n🔍 Checking raw database data for comparison...');

            // Get sponsor ID
            const { data: sponsor } = await supabase
                .from('sponsors')
                .select('id')
                .eq('email', 'jyotiranjansahoo485@gmail.com')
                .single();

            if (sponsor) {
                // Get approved vehicles
                const [bikes, cars, scooty] = await Promise.all([
                    supabase.from('bikes').select('id').eq('sponsor_id', sponsor.id),
                    supabase.from('cars').select('id').eq('sponsor_id', sponsor.id),
                    supabase.from('scooty').select('id').eq('sponsor_id', sponsor.id)
                ]);

                const vehicleIds = [
                    ...(bikes.data || []).map(v => v.id),
                    ...(cars.data || []).map(v => v.id),
                    ...(scooty.data || []).map(v => v.id)
                ];

                console.log(`   Total vehicles in main tables: ${vehicleIds.length}`);

                if (vehicleIds.length > 0) {
                    // Get completed bookings
                    const { data: bookings } = await supabase
                        .from('bookings')
                        .select('*')
                        .in('vehicle_id', vehicleIds)
                        .in('status', ['completed', 'ride_completed', 'ride_ended', 'payment_success']);

                    console.log(`   Completed bookings in DB: ${bookings?.length || 0}`);

                    if (bookings && bookings.length > 0) {
                        const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
                        console.log(`   Total revenue from DB: ₹${totalRevenue}`);

                        console.log('\n   Booking Details:');
                        bookings.forEach(b => {
                            console.log(`      ${b.booking_id}: ₹${b.total_amount} (Vehicle ${b.vehicle_id}, Type: ${b.vehicle_type})`);
                        });
                    }
                }
            }

        } else {
            console.log('❌ Jyoti Ranjan not found in API response');
            console.log('\n📋 Available sponsors in response:');
            data.report?.forEach(r => {
                console.log(`   - ${r.name} (${r.email}): ${r.bookings} bookings`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Backend server is not running on port 3005');
            console.log('   Please start it with: npm start');
        }
    }
}

checkAPIEndpoint().then(() => process.exit());

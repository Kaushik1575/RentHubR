const SponsorModel = require('../models/sponsorModel');

async function testDirectly() {
    console.log('🧪 Testing getSponsorEarningsReport directly...\n');

    try {
        console.log('Calling SponsorModel.getSponsorEarningsReport()...');
        const result = await SponsorModel.getSponsorEarningsReport();

        console.log(`\n✅ Function returned ${result?.length || 0} sponsors\n`);

        if (result && result.length > 0) {
            console.log('📊 Results:');
            result.forEach(r => {
                console.log(`\n   ${r.name} (${r.email})`);
                console.log(`      Vehicles: ${r.vehicleCount}`);
                console.log(`      Bookings: ${r.bookings}`);
                console.log(`      Revenue: ₹${r.revenue}`);
            });
        } else {
            console.log('❌ No results returned!');
            console.log('   This suggests an error in the function or no data matches the criteria.');
        }

    } catch (error) {
        console.error('\n❌ Error calling function:');
        console.error(error);
    }
}

testDirectly().then(() => process.exit());

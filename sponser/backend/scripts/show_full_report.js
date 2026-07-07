const SponsorModel = require('../models/sponsorModel');

async function showAllData() {
    console.log('📊 FULL SPONSOR EARNINGS REPORT\n');
    console.log('='.repeat(80));

    try {
        const result = await SponsorModel.getSponsorEarningsReport();

        console.log(`\nTotal Sponsors: ${result?.length || 0}\n`);

        if (result && result.length > 0) {
            result.forEach((r, idx) => {
                console.log(`\n${idx + 1}. ${r.name}`);
                console.log(`   Email: ${r.email}`);
                console.log(`   ID: ${r.id}`);
                console.log(`   Vehicles: ${r.vehicleCount}`);
                console.log(`   Bookings: ${r.bookings}`);
                console.log(`   Revenue: ₹${r.revenue}`);
                console.log(`   Sponsor Share (70%): ₹${Math.round(r.revenue * 0.7)}`);
                console.log(`   Platform Fee (30%): ₹${Math.round(r.revenue * 0.3)}`);
                console.log(`   Withdrawn: ₹${r.withdrawn}`);

                const balance = Math.round(r.revenue * 0.7) - r.withdrawn;
                console.log(`   Balance: ₹${balance}`);
            });
        }

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

showAllData().then(() => process.exit());

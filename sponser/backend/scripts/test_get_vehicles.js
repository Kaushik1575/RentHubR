const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const SponsorModel = require('../models/sponsorModel');

async function testGetSponsorVehicles() {
    const targetEmail = 'dask64576@gmail.com';

    // Get sponsor ID
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('email', targetEmail)
        .single();

    if (!sponsor) {
        console.log("Sponsor not found");
        return;
    }

    console.log(`Testing getSponsorVehicles for: ${targetEmail}`);
    console.log(`Sponsor ID: ${sponsor.id}\n`);

    // Call the function
    const vehicles = await SponsorModel.getSponsorVehicles(sponsor.id);

    console.log(`Total vehicles returned: ${vehicles.length}\n`);

    // Find Honda Hornet
    const hornet = vehicles.find(v => v.name && v.name.toLowerCase().includes('honda') && v.name.toLowerCase().includes('hornet'));

    if (hornet) {
        console.log("✅ Honda Hornet found!");
        console.log(`  Name: ${hornet.name}`);
        console.log(`  ID: ${hornet.id}`);
        console.log(`  Type: ${hornet.type}`);
        console.log(`  Total Bookings: ${hornet.totalBookings}`);
        console.log(`  Total Hours: ${hornet.totalRideHours}`);
        console.log(`  Total Revenue: ₹${hornet.totalRevenue}`);
    } else {
        console.log("❌ Honda Hornet not found in results");
    }

    // Show all vehicles with their stats
    console.log("\n=== All Vehicles ===");
    vehicles.forEach(v => {
        console.log(`${v.name}: ${v.totalBookings} bookings, ${v.totalRideHours}h, ₹${v.totalRevenue}`);
    });
}

testGetSponsorVehicles().catch(console.error);

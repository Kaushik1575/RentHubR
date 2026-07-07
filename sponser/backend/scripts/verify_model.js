const SponsorModel = require('../models/sponsorModel');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verify() {
    console.log('Verifying SponsorModel directly...');
    const result = await SponsorModel.getSponsorEarningsReport();

    if (result.debug) {
        console.log('✅ Debug info found! Code on disk is updated.');
        console.log('Kaushik Stats in Debug:', result.debug.kaushikVehicles);
        console.log('Kaushik Bookings Found:', result.debug.kaushikBookings.length);
    } else {
        console.log('❌ No debug info returned. Code on disk might be stale?');
    }
}

verify();

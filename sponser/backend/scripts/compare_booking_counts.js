const supabase = require('../config/supabase');
const SponsorModel = require('../models/sponsorModel');

async function compareBookingCounts() {
    console.log('🔍 Comparing booking counts between Admin Report and Sponsor Dashboard...\n');

    // Get Kaushik Das's sponsor entry
    const { data: sponsors } = await supabase
        .from('sponsors')
        .select('id, full_name, email')
        .ilike('full_name', '%kaushik%');

    if (!sponsors || sponsors.length === 0) {
        console.log('❌ Kaushik Das not found');
        return;
    }

    const sponsor = sponsors[0];
    console.log(`✅ Testing for: ${sponsor.full_name}`);
    console.log(`   Email: ${sponsor.email}`);
    console.log(`   ID: ${sponsor.id}\n`);

    // === METHOD 1: Admin Report Logic (getSponsorEarningsReport) ===
    console.log('📊 Method 1: Admin Report (getSponsorEarningsReport)');
    const adminReport = await SponsorModel.getSponsorEarningsReport();
    const adminEntry = adminReport.find(r => r.id === sponsor.id);

    if (adminEntry) {
        console.log(`   Bookings: ${adminEntry.bookings}`);
        console.log(`   Revenue: ₹${adminEntry.revenue}`);
        console.log(`   Vehicles: ${adminEntry.vehicleCount}`);
    } else {
        console.log('   ❌ Not found in admin report');
    }

    // === METHOD 2: Sponsor Dashboard Logic (getDetailedRevenueStats) ===
    console.log('\n📊 Method 2: Sponsor Dashboard (getDetailedRevenueStats)');
    const dashboardStats = await SponsorModel.getDetailedRevenueStats(sponsor.id);
    console.log(`   Bookings: ${dashboardStats.transactions.length}`);
    console.log(`   Revenue: ₹${dashboardStats.grossRevenue}`);
    console.log(`   Vehicles: ${dashboardStats.vehicleStats.length}`);

    // === COMPARISON ===
    console.log('\n🔍 COMPARISON:');
    const adminBookings = adminEntry ? adminEntry.bookings : 0;
    const dashboardBookings = dashboardStats.transactions.length;

    if (adminBookings === dashboardBookings) {
        console.log(`✅ MATCH! Both show ${adminBookings} bookings`);
    } else {
        console.log(`❌ MISMATCH!`);
        console.log(`   Admin Report: ${adminBookings}`);
        console.log(`   Dashboard: ${dashboardBookings}`);
        console.log(`   Difference: ${Math.abs(adminBookings - dashboardBookings)}`);
    }
}

compareBookingCounts().catch(console.error).finally(() => process.exit());

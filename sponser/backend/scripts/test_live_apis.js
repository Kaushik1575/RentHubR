const axios = require('axios');

async function testBothAPIs() {
    console.log('🧪 Testing Admin Panel vs Sponsor Dashboard API...\n');

    // You'll need to update these with actual sponsor credentials
    const sponsorEmail = 'dask64576@gmail.com';
    const sponsorPassword = 'password123'; // Update if different

    try {
        // 1. Login as sponsor to get token
        console.log('1️⃣ Logging in as sponsor...');
        const loginRes = await axios.post('http://localhost:3005/api/sponsor/login', {
            email: sponsorEmail,
            password: sponsorPassword
        });

        const token = loginRes.data.token;
        const sponsorId = loginRes.data.user.id;
        console.log(`   ✅ Logged in as: ${loginRes.data.user.full_name}`);
        console.log(`   Sponsor ID: ${sponsorId}\n`);

        // 2. Get Sponsor Dashboard stats
        console.log('2️⃣ Fetching Sponsor Dashboard data...');
        const dashboardRes = await axios.get('http://localhost:3005/api/sponsor/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`   Total Bookings: ${dashboardRes.data.totalBookings}`);
        console.log(`   Total Revenue: ₹${dashboardRes.data.totalRevenue}`);
        console.log(`   Net Earnings: ₹${dashboardRes.data.netEarnings}\n`);

        // 3. Get Admin Report (no auth needed for this endpoint usually)
        console.log('3️⃣ Fetching Admin Sponsor Earnings Report...');
        const adminRes = await axios.get('http://localhost:3005/api/sponsor/earnings-report');

        const sponsorEntry = adminRes.data.report.find(r => r.id === sponsorId);

        if (sponsorEntry) {
            console.log(`   Total Bookings: ${sponsorEntry.bookings}`);
            console.log(`   Total Revenue: ₹${sponsorEntry.totalRevenue}`);
            console.log(`   Sponsor Share: ₹${sponsorEntry.sponsorShare}\n`);

            // 4. Compare
            console.log('🔍 COMPARISON:');
            console.log(`   Dashboard Bookings: ${dashboardRes.data.totalBookings}`);
            console.log(`   Admin Report Bookings: ${sponsorEntry.bookings}`);

            if (dashboardRes.data.totalBookings === sponsorEntry.bookings) {
                console.log('\n   ✅ MATCH! Both show same booking count');
            } else {
                console.log('\n   ❌ MISMATCH!');
                console.log(`   Difference: ${Math.abs(dashboardRes.data.totalBookings - sponsorEntry.bookings)} bookings`);
            }

            // Show revenue comparison
            console.log(`\n   Dashboard Revenue: ₹${dashboardRes.data.totalRevenue}`);
            console.log(`   Admin Report Revenue: ₹${sponsorEntry.totalRevenue}`);

            if (dashboardRes.data.totalRevenue === sponsorEntry.totalRevenue) {
                console.log('   ✅ Revenue matches!');
            } else {
                console.log('   ❌ Revenue mismatch!');
            }
        } else {
            console.log('   ❌ Sponsor not found in admin report!');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('\n⚠️  Authentication failed. Please update the password in the script.');
        }
    }
}

testBothAPIs();

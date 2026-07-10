require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
    const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('email')
        .eq('is_admin', true);
    
    const adminEmails = admins.map(a => a.email);
    console.log("Admin Emails:", adminEmails);
    
    const { sendSOSAlertEmail } = require('./config/emailService');
    const res = await sendSOSAlertEmail(adminEmails, {
        bookingId: 'RH-TEST',
        userName: 'Test User',
        phoneNumber: '1234567890',
        userEmail: 'test@example.com',
        bikeModel: 'Test Bike',
        pickupLocation: 'Test Location',
        timestamp: new Date().toLocaleString(),
        gpsLocation: 'Test GPS',
        googleMapsLink: 'https://maps.google.com'
    });
    console.log("Email Send Result:", res);
}
test();

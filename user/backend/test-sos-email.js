require('dotenv').config();
const { sendSOSLinkEmail, sendSOSAlertEmail } = require('./config/emailService');

async function test() {
    const testEmail = 'jyoti2006@gmail.com';
    console.log('Sending SOS Link Email...');
    const res1 = await sendSOSLinkEmail(testEmail, 'Test User', 'http://localhost:5173/sos-activate?token=test');
    console.log('Link Email Result:', res1);

    console.log('Sending SOS Alert Email...');
    const sosData = {
        bookingId: 'RH-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        phoneNumber: '1234567890',
        bikeModel: 'Test Bike',
        pickupLocation: 'Test Location',
        timestamp: new Date().toISOString(),
        gpsLocation: 'Lat: 0, Lng: 0',
        googleMapsLink: 'https://maps.google.com'
    };
    const res2 = await sendSOSAlertEmail(testEmail, sosData);
    console.log('Alert Email Result:', res2);
}
test();

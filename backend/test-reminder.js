// Quick test script to verify reminder system
// Run this with: node test-reminder.js

require('dotenv').config();
const { sendImmediateReminderIfNeeded } = require('./services/reminderService');

async function test() {
    console.log('🧪 Testing reminder system...\n');

    // Test with a booking ID (replace with your actual booking ID)
    const testBookingId = process.argv[2];

    if (!testBookingId) {
        console.log('❌ Please provide a booking ID:');
        console.log('   node test-reminder.js <booking_id>');
        console.log('\nExample: node test-reminder.js 123');
        process.exit(1);
    }

    console.log(`Testing with booking ID: ${testBookingId}\n`);

    try {
        const result = await sendImmediateReminderIfNeeded(testBookingId);
        console.log('\n✅ Test Result:', JSON.stringify(result, null, 2));

        if (result.success && result.reminderSent) {
            console.log('\n🎉 SUCCESS! Reminder email was sent!');
        } else if (result.success && result.alreadySent) {
            console.log('\n⚠️  Reminder was already sent for this booking');
        } else if (result.success && result.notNeeded) {
            console.log('\n⚠️  Booking is not within 2 hours - no reminder needed');
        } else {
            console.log('\n❌ Failed:', result.error);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }

    process.exit(0);
}

test();

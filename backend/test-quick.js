// Quick test to verify Booking ID generation
const { generateBookingId } = require('./utils/bookingIdGenerator');

console.log('🧪 Testing Booking ID Generation...\n');

generateBookingId()
    .then(id => {
        console.log('✅ SUCCESS!');
        console.log('Generated Booking ID:', id);
        console.log('\nFormat check:');
        console.log('- Starts with RH:', id.startsWith('RH') ? '✅' : '❌');
        console.log('- Has dash:', id.includes('-') ? '✅' : '❌');
        console.log('- Length:', id.length, '(should be 13-15)');
        console.log('\n✅ Booking ID system is working!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FAILED!');
        console.error('Error:', err.message);
        console.error('\nPossible issues:');
        console.error('1. Database migration not run in Supabase');
        console.error('2. booking_id_sequence table missing');
        console.error('3. increment_booking_sequence() function missing');
        console.error('\nRun this SQL in Supabase:');
        console.error('SELECT * FROM booking_id_sequence;');
        process.exit(1);
    });

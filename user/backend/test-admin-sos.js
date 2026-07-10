require('dotenv').config();
const { sendSOS } = require('./controllers/admin.controller');
const supabase = require('./config/supabase');

async function test() {
    // Find a confirmed booking
    const { data: bookings } = await supabase.from('bookings').select('id, status').eq('status', 'confirmed').limit(1);
    
    if (!bookings || bookings.length === 0) {
        console.log('No confirmed bookings found');
        return;
    }

    const bookingId = bookings[0].id;
    console.log(`Testing with booking ID: ${bookingId}`);

    const req = {
        body: {
            bookingId: bookingId
        }
    };

    const res = {
        json: (data) => console.log('Response JSON:', data),
        status: (code) => {
            console.log('Response Status:', code);
            return { json: (data) => console.log('Response JSON:', data) };
        }
    };

    try {
        await sendSOS(req, res);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();

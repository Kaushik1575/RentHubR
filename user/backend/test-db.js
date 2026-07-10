require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
    const { data: booking, error } = await supabase.from('bookings').select('*, users:user_id(email, full_name, phone_number)').limit(1).order('id', { ascending: false });
    console.log('Booking:', JSON.stringify(booking, null, 2));
    console.log('Error:', error);
}
test();

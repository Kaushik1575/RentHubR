require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
    const { data: admins, error } = await supabase.from('users').select('email').eq('is_admin', true);
    console.log('Admins in DB:', admins);
    console.log('Error:', error);
}
test();

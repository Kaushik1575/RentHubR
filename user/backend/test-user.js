require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', 'jyoti2006@gmail.com');
    console.log('User:', user);
    console.log('Error:', error);
}
test();

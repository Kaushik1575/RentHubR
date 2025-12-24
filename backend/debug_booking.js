const supabase = require('./config/supabase');

async function checkBooking() {
    console.log('Fetching bookings...');
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'cancelled')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent Cancelled Booking:', JSON.stringify(data, null, 2));
    }
}

checkBooking();

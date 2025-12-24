const supabase = require('./config/supabase');

async function checkBooking() {
    console.log('Fetching bookings...');
    const { data, error } = await supabase
        .from('bookings')
        .select('id, status, refund_status, refund_details, refund_amount')
        .eq('status', 'cancelled')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent Booking ID:', data[0].id);
        console.log('Refund Details Type:', typeof data[0].refund_details);
        console.log('Refund Details Content:', JSON.stringify(data[0].refund_details, null, 2));
    }
}

checkBooking();

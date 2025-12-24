const supabase = require('./config/supabase');

async function testJsonUpdate() {
    console.log('Testing JSON update on a booking...');

    // 1. Fetch the most recent cancelled booking
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, refund_details')
        .eq('status', 'cancelled')
        .limit(1)
        .single();

    if (fetchError || !booking) {
        console.error('Fetch Error or No Booking found:', fetchError);
        return;
    }

    console.log('Found Booking:', booking.id);
    console.log('Current Details:', booking.refund_details);

    // 2. Try to update it with a test object
    const testDetails = {
        method: 'upi',
        upiId: 'test@upi',
        timestamp: new Date().toISOString(),
        test_flag: 'DEBUG_WRITE'
    };

    const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({ refund_details: testDetails })
        .eq('id', booking.id)
        .select()
        .single();

    if (updateError) {
        console.error('Update FAILED:', updateError);
        console.error('Suggestion: Check if refund_details column exists and is of type JSONB/JSON');
    } else {
        console.log('Update SUCCESS. New Details:', updated.refund_details);
    }
}

testJsonUpdate();

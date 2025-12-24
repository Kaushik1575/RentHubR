const supabase = require('./config/supabase');

async function updateRefundDetails() {
    console.log("Updating booking 208 with test refund details...");

    const dummyDetails = {
        method: 'upi',
        upiId: 'test@upi',
        amount: 500,
        timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('bookings')
        .update({
            refund_details: dummyDetails,
            status: 'cancelled',
            refund_amount: 500,
            refund_status: 'pending'
        })
        .eq('id', 208)
        .select();

    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Update success:", data);
    }
}

updateRefundDetails();

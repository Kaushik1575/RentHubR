require('dotenv').config();
const supabase = require('./config/supabase');

async function checkBooking() {
    console.log("Checking for bookings...");

    // 1. Search by specific ID
    const searchId = 'RH260116-045';
    console.log(`Searching for booking_id: ${searchId}`);

    const { data: specific, error: err1 } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', searchId);

    console.log("Specific Search Result:", specific);
    if (err1) console.error("Error:", err1);

    // 2. Search for ANY booking starting with RH to see format
    const { data: anyRH, error: err2 } = await supabase
        .from('bookings')
        .select('id, booking_id, status')
        .ilike('booking_id', 'RH%')
        .limit(5);

    console.log("Sample RH Bookings:", anyRH);

    // 3. Search for ANY booking to see format if RH is empty
    if (!anyRH || anyRH.length === 0) {
        const { data: any, error: err3 } = await supabase
            .from('bookings')
            .select('id, booking_id')
            .limit(5);
        console.log("Random Bookings:", any);
    }
}

checkBooking();

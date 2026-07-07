const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSponsorData() {
    const targetEmail = 'dask64576@gmail.com'; // Hardcoded for this check
    console.log(`Checking data for: ${targetEmail}`);

    // 1. Get Sponsor ID
    const { data: sponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (sponsorError || !sponsor) {
        console.error('Sponsor not found:', sponsorError);
        return;
    }

    // 2. Check Requests
    const { data: requests, error: reqError } = await supabase
        .from('sponsor_vehicle_requests')
        .select('*')
        .eq('sponsor_id', sponsor.id);

    const result = {
        sponsor: { id: sponsor.id, name: sponsor.full_name },
        requests: requests || [],
        live: {}
    };

    const tables = ['bikes', 'cars', 'scooty'];
    for (const table of tables) {
        const { data: vehicles } = await supabase.from(table).select('*').eq('sponsor_id', sponsor.id);
        result.live[table] = vehicles || [];
    }

    console.log(JSON.stringify(result, null, 2));
}

checkSponsorData();

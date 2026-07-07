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

async function repairSponsorVehicles() {
    console.log("Starting repair job...");
    const targetEmail = 'dask64576@gmail.com';

    // 1. Get Sponsor
    const { data: sponsor, error: sError } = await supabase.from('sponsors').select('*').eq('email', targetEmail).single();
    if (sError || !sponsor) { console.error("Sponsor not found"); return; }

    console.log(`Processing Sponsor: ${sponsor.full_name} (${sponsor.id})`);

    // 2. Get Approved Requests
    const { data: requests, error: rError } = await supabase
        .from('sponsor_vehicle_requests')
        .select('*')
        .eq('sponsor_id', sponsor.id)
        .eq('status', 'approved');

    if (rError) { console.error("Error fetching requests"); return; }
    console.log(`Found ${requests.length} approved requests.`);

    for (const req of requests) {
        console.log(`Analyzing request: ${req.name} (Type: ${req.vehicle_type})`);

        let tableName = 'bikes';
        const type = (req.vehicle_type || '').toLowerCase();

        if (type === 'car') tableName = 'cars';
        else if (type === 'scooty' || type === 'scooter') tableName = 'scooty';
        else tableName = 'bikes'; // Default

        console.log(`-> Target Table: ${tableName}`);

        // Check if it exists in the main table with this sponsor_id
        // We match loosely on name to avoid duplicates if possible, or we could just check if ANY vehicle exists with this sponsor_id
        // But better to check name/reg number.

        const { data: existing, error: eError } = await supabase
            .from(tableName)
            .select('*')
            .eq('sponsor_id', sponsor.id)
            .eq('name', req.name);

        if (existing && existing.length > 0) {
            console.log(`✅ [OK] ${req.name} already exists in ${tableName}.`);
        } else {
            console.log(`❌ [MISSING] ${req.name} is approved but missing in ${tableName}. Creating it now...`);

            // Insert it with only the columns that exist in the target table
            const newVehicle = {
                name: req.name,
                price: req.price,
                image_url: req.image_url,
                sponsor_id: sponsor.id,
                is_approved: true,
                is_available: true
            };

            const { error: insertError } = await supabase.from(tableName).insert([newVehicle]);
            if (insertError) {
                console.error(`Failed to insert ${req.name}:`, insertError.message);
            } else {
                console.log(`✨ Successfully restored ${req.name} to ${tableName}!`);
            }
        }
    }
}

repairSponsorVehicles();

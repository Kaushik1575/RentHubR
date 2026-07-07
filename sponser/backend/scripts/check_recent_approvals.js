const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecentApprovals() {
    console.log("=== Checking Recent Approvals ===\n");

    // Check for recently approved requests
    const { data: recentApprovals } = await supabase
        .from('sponsor_vehicle_requests')
        .select('*')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(5);

    console.log(`Recent approved requests: ${recentApprovals?.length || 0}\n`);

    if (recentApprovals && recentApprovals.length > 0) {
        for (const req of recentApprovals) {
            console.log(`\n--- Request ID: ${req.id} ---`);
            console.log(`Vehicle: ${req.name}`);
            console.log(`Type: ${req.vehicle_type}`);
            console.log(`Sponsor ID: ${req.sponsor_id}`);
            console.log(`Status: ${req.status}`);
            console.log(`Approved at: ${req.updated_at}`);

            // Check if it exists in the main table
            let tableName = 'bikes';
            if (req.vehicle_type === 'car') tableName = 'cars';
            if (req.vehicle_type === 'scooty') tableName = 'scooty';

            const { data: existing } = await supabase
                .from(tableName)
                .select('*')
                .eq('name', req.name)
                .eq('sponsor_id', req.sponsor_id);

            if (existing && existing.length > 0) {
                console.log(`✅ EXISTS in ${tableName} table (ID: ${existing[0].id})`);
            } else {
                console.log(`❌ NOT FOUND in ${tableName} table - NEEDS REPAIR!`);

                // Insert it
                const { data: inserted, error } = await supabase
                    .from(tableName)
                    .insert({
                        name: req.name,
                        price: req.price,
                        image_url: req.image_url,
                        sponsor_id: req.sponsor_id,
                        is_approved: true,
                        is_available: true
                    })
                    .select();

                if (error) {
                    console.log(`   Error inserting: ${error.message}`);
                } else {
                    console.log(`   ✅ INSERTED successfully! ID: ${inserted[0].id}`);
                }
            }
        }
    }
}

checkRecentApprovals().catch(console.error);

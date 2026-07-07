const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnoseApprovalIssue() {
    console.log("=== Diagnosing Approval Issue ===\n");

    // 1. Check ALL requests (any status)
    const { data: allRequests } = await supabase
        .from('sponsor_vehicle_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log(`Total recent requests: ${allRequests?.length || 0}\n`);

    if (allRequests && allRequests.length > 0) {
        console.log("Recent Requests:");
        allRequests.forEach(req => {
            console.log(`  - ${req.name} (${req.vehicle_type}) - Status: ${req.status} - Sponsor: ${req.sponsor_id?.substring(0, 8)}...`);
        });

        // 2. For each approved request, check if it's in the main table
        const approvedRequests = allRequests.filter(r => r.status === 'approved');

        console.log(`\n\nApproved requests: ${approvedRequests.length}`);

        for (const req of approvedRequests) {
            let tableName = 'bikes';
            if (req.vehicle_type === 'car') tableName = 'cars';
            if (req.vehicle_type === 'scooty') tableName = 'scooty';

            const { data: existing } = await supabase
                .from(tableName)
                .select('*')
                .eq('sponsor_id', req.sponsor_id);

            console.log(`\n${req.name}:`);
            console.log(`  Sponsor has ${existing?.length || 0} vehicles in ${tableName} table`);

            const match = existing?.find(v => v.name === req.name);
            if (match) {
                console.log(`  ✅ Found in ${tableName} (ID: ${match.id})`);
            } else {
                console.log(`  ❌ NOT in ${tableName} - NEEDS REPAIR`);
            }
        }
    }
}

diagnoseApprovalIssue().catch(console.error);

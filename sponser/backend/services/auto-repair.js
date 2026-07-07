const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Auto-Repair Service
 * This runs periodically to find approved requests and ensure they exist in main tables
 */
async function autoRepairVehicles() {
    console.log(`[${new Date().toISOString()}] Running auto-repair check...`);

    try {
        // Get all approved requests
        const { data: approvedRequests } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*')
            .eq('status', 'approved');

        if (!approvedRequests || approvedRequests.length === 0) {
            console.log('  No approved requests found.');
            return;
        }

        console.log(`  Found ${approvedRequests.length} approved requests. Checking...`);

        let repairedCount = 0;

        for (const req of approvedRequests) {
            // Determine table
            let tableName = 'bikes';
            if (req.vehicle_type === 'car') tableName = 'cars';
            if (req.vehicle_type === 'scooty') tableName = 'scooty';

            // Check if exists
            const { data: existing } = await supabase
                .from(tableName)
                .select('id')
                .eq('name', req.name)
                .eq('sponsor_id', req.sponsor_id)
                .single();

            if (!existing) {
                // Missing! Insert it
                const { error } = await supabase
                    .from(tableName)
                    .insert({
                        name: req.name,
                        price: req.price,
                        image_url: req.image_url,
                        sponsor_id: req.sponsor_id,
                        is_approved: true,
                        is_available: true
                    });

                if (!error) {
                    console.log(`  ✅ Repaired: ${req.name} -> ${tableName}`);
                    repairedCount++;
                } else {
                    console.error(`  ❌ Failed to repair ${req.name}:`, error.message);
                }
            }
        }

        if (repairedCount > 0) {
            console.log(`  🔧 Repaired ${repairedCount} vehicles!`);
        } else {
            console.log('  ✅ All approved vehicles are in sync.');
        }

    } catch (error) {
        console.error('  Error in auto-repair:', error.message);
    }
}

// Run immediately
autoRepairVehicles();

// Then run every 5 minutes
setInterval(autoRepairVehicles, 5 * 60 * 1000);

console.log('🔧 Auto-Repair Service Started');
console.log('   Checking every 5 minutes for missing approved vehicles...');

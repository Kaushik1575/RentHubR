const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    console.error(`URL: ${SUPABASE_URL}, Key: ${SUPABASE_KEY ? 'FOUND' : 'MISSING'}`);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const checkAndAddColumns = async () => {
    try {
        console.log('Checking for missing columns...');

        const tables = ['bikes', 'cars', 'scooty'];
        const columns = [
            { name: 'sponsor_id', type: 'uuid', default: null },
            { name: 'is_approved', type: 'boolean', default: true },
            { name: 'is_available', type: 'boolean', default: true }
        ];

        for (const table of tables) {
            console.log(`\n--- Inspecting table: ${table} ---`);

            // Check if table exists (basic check, usually tables exist)
            const { data: testData, error: testError } = await supabase.from(table).select('id').limit(1);
            if (testError && testError.code === 'PGRST204') {
                console.log(`Table ${table} likely does not exist or is not accessible.`);
                continue;
            }

            for (const col of columns) {
                // Try to select the column to see if it exists
                const { error } = await supabase.from(table).select(col.name).limit(1);

                if (error) {
                    // Start of error check
                    if (error.code === 'PGRST100' || error.message.includes('recursion') || error.message.includes('does not exist')) {
                        console.log(`Column '${col.name}' is MISSING in '${table}'. Adding it...`);

                        // We cannot run ALTER TABLE directly via supabase-js client unless using RPC or raw SQL via extension.
                        // However, for this environment, we might not have raw SQL access.
                        // But if we are running locally with potential direct db access or if we assume manual intervention:
                        // Since we failed `psql` and `sql_runner`, we will log the EXACT SQL needed for the user to run in Supabase Dashboard.

                        console.log(`\n*** ACTION REQUIRED ***`);
                        console.log(`Please run the following SQL in your Supabase SQL Editor to fix '${table}':`);
                        console.log(`ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} ${col.default !== null ? 'DEFAULT ' + col.default : ''};`);
                        if (col.name === 'sponsor_id') {
                            console.log(`ALTER TABLE public.${table} ADD CONSTRAINT fk_${table}_sponsor FOREIGN KEY (sponsor_id) REFERENCES public.sponsors(id);`);
                        }
                        console.log(`*** END ACTION ***\n`);
                    } else {
                        console.log(`Column '${col.name}' exists in '${table}' (or other error: ${error.message})`);
                    }
                } else {
                    console.log(`✅ Column '${col.name}' exists in '${table}'.`);
                }
            }
        }
        console.log('\nCheck complete.');

    } catch (error) {
        console.error('Script error:', error);
    }
};

checkAndAddColumns();

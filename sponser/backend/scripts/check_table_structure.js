const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStructure() {
    // Get one row from each table to see the structure
    const tables = ['bikes', 'cars', 'scooty'];

    for (const table of tables) {
        console.log(`\n=== ${table.toUpperCase()} TABLE ===`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('No data in table');
        }
    }
}

checkStructure();

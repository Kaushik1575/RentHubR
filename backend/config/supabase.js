const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Explicitly point to backend root .env

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log("Loading Supabase Config...");
console.log("CWD:", process.cwd());
console.log("Env path resolved to:", path.resolve(__dirname, '../.env'));
console.log("Supabase URL present:", !!supabaseUrl);
console.log("Supabase Key present:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    // Do not exit immediately, let's see what happens.
    // process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 
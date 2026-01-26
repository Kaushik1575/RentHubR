const SupabaseDB = require('./models/supabaseDB');
require('dotenv').config();

async function checkDatabaseSchema() {
    console.log('🔍 Checking Database Schema...');
    try {
        // limit 1
        const { data, error } = await require('./config/supabase')
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error fetching users:', error.message);
            return;
        }

        if (data && data.length > 0) {
            const user = data[0];
            const keys = Object.keys(user);
            console.log('📋 User Table Columns:', keys.join(', '));

            if (keys.includes('session_id')) {
                console.log('✅ SUCCESS: "session_id" column EXISTS.');
            } else {
                console.log('❌ FAILURE: "session_id" column is MISSING.');
                console.log('⚠️  You MUST run the SQL command in your Supabase Dashboard SQL Editor!');
            }
        } else {
            console.log('⚠️ No users found to check structure. Please verify manually.');
        }

    } catch (e) {
        console.error('Script error:', e);
    }
}

checkDatabaseSchema();

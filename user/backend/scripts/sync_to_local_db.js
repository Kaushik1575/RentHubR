const { Client } = require('pg');
const supabase = require('../config/supabase');

const pgClient = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://renthub:renthub_secure_password@localhost:5432/renthub_db'
});

async function syncTable(tableName) {
    console.log(`📥 Fetching ${tableName} from Supabase...`);
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`❌ Error fetching ${tableName} from Supabase:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`⚠️ No data found in ${tableName}`);
        return;
    }

    console.log(`Found ${data.length} records in ${tableName}. Creating local table...`);

    await pgClient.query(`DROP TABLE IF EXISTS "${tableName}";`);
    await pgClient.query(`
        CREATE TABLE "${tableName}" (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL
        );
    `);

    // Clear old local cache for this table
    await pgClient.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY;`);

    // Insert all items
    for (const item of data) {
        await pgClient.query(
            `INSERT INTO "${tableName}" (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2;`,
            [item.id, JSON.stringify(item)]
        );
    }

    console.log(`✅ Successfully synced ${data.length} items to local PostgreSQL table "${tableName}"!`);
}

async function runSync() {
    try {
        console.log("🔌 Connecting to local Docker PostgreSQL...");
        await pgClient.connect();
        console.log("Connected!\n");

        await syncTable('cars');
        await syncTable('bikes');
        await syncTable('scooty');
        await syncTable('offers');

        console.log("\n🎉 ALL VEHICLES AND OFFERS ARE NOW SAVED LOCALLY IN YOUR DOCKER DATABASE!");
        console.log("Your local database is fully loaded and ready for offline use.");
    } catch (err) {
        console.error("❌ Sync error:", err);
    } finally {
        await pgClient.end();
    }
}

runSync();

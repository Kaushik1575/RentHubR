const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

async function updateConstraint() {
    try {
        await client.connect();

        console.log("Connected to Database. Updating constraint...");

        const query = `
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_status;
            ALTER TABLE bookings ADD CONSTRAINT valid_status 
            CHECK (status IN ('pending', 'confirmed', 'ride_started', 'ride_completed', 'cancelled', 'completed', 'rider_not_come'));
        `;

        await client.query(query);
        console.log("✅ Successfully updated 'valid_status' constraint to include 'rider_not_come'.");

    } catch (err) {
        console.error("❌ Error updating constraint:", err);
    } finally {
        await client.end();
    }
}

updateConstraint();

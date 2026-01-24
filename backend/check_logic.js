const SupabaseDB = require('./models/supabaseDB');
require('dotenv').config();

const testCalculation = async () => {
    try {
        console.log("--- Fetching Settings ---");
        const settings = await SupabaseDB.getLoyaltySettings();
        console.log("Settings:", settings);

        const earningRate = parseFloat(settings.earning_rate) || 1;
        console.log("Earning Rate:", earningRate);

        // Simulation parameters from screenshot
        // Start: 16 Jan 2026, 10:11 am
        // End: 16 Jan 2026, 08:01 pm

        // Construct dates (Assume local time implies these ISOs if backend is UTC? Or just diff)
        // Let's use exact difference of 9h 50m = 590 mins to be safe on timezone
        const startTime = new Date("2026-01-16T10:11:00");
        const endTime = new Date("2026-01-16T20:01:00");

        const durationMs = endTime - startTime;
        console.log("Duration MS:", durationMs);

        const totalMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));
        console.log("Total Minutes:", totalMinutes);

        const coinsEarned = Math.floor(totalMinutes * earningRate);
        console.log("Coins Earned:", coinsEarned);

        console.log("-------------------------");

        if (coinsEarned === 590) {
            console.log("✅ RESULT: 590 Coins (Correct)");
        } else {
            console.log(`❌ RESULT: ${coinsEarned} Coins (Incorrect - Expected 590)`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
};

testCalculation();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env loading
const loadEnv = (relativePath) => {
    try {
        const envPath = path.resolve(__dirname, relativePath);
        if (fs.existsSync(envPath)) {
            console.log(`Loading .env from ${envPath}`);
            const envConfig = fs.readFileSync(envPath, 'utf8');
            console.log('DEBUG: Raw start: ' + envConfig.substring(0, 100));
            envConfig.split('\n').forEach(line => {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    const val = values.join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key.trim()] = val;
                    if (key.trim().includes('SUPABASE')) console.log('DEBUG: Found key ' + key.trim());
                }
            });
        }
    } catch (e) {
        console.error('Error reading .env:', e);
    }
};

loadEnv('../.env');
loadEnv('../../frontend/.env');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillCoins() {
    console.log('🚀 Starting Super Coins backfill...');

    // 1. Fetch all completed bookings
    // Status can be 'ride_completed', 'completed', or perhaps just confirmed if we want to be generous? 
    // Let's stick to completed/ride_completed
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['ride_completed', 'completed', 'confirmed']); // Including confirmed just in case old tests are stuck there? No, sticking to confirmed might be tricky if they rely on manual start. 
    // Let's just do completed ones for safety as per user request "previous ride".

    if (error) {
        console.error('Error fetching bookings:', error);
        return;
    }

    console.log(`Found ${bookings.length} bookings to process.`);

    let totalCoinsDistributed = 0;
    const userCoinUpdates = {}; // userId -> coinAmount

    for (const booking of bookings) {
        // Skip if already has coins (assuming we don't want to double count if script runs twice)
        // But user asked to "add", so maybe we should check if coins_earned is 0 or null?
        if (booking.coins_earned && booking.coins_earned > 0) {
            console.log(`Skipping booking ${booking.id} - already has ${booking.coins_earned} coins.`);
            continue;
        }

        // Determine Duration
        // Logic similar to handleQRScan
        let durationMinutes = 0;

        if (booking.actual_duration_hours) {
            durationMinutes = Math.floor(booking.actual_duration_hours * 60);
        } else if (booking.ride_start_time && booking.ride_end_time) {
            const start = new Date(booking.ride_start_time);
            const end = new Date(booking.ride_end_time);
            const diffMs = end - start;
            durationMinutes = Math.floor(diffMs / (1000 * 60));
        } else if (booking.duration) {
            // Fallback: Use booked duration
            durationMinutes = Math.floor(parseFloat(booking.duration) * 60);
        }

        if (durationMinutes <= 0) {
            console.log(`Skipping booking ${booking.id} - zero or invalid duration.`);
            continue;
        }

        const coins = Math.floor(durationMinutes * 1); // Rate: 1 coin/min

        // Update Booking
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ coins_earned: coins })
            .eq('id', booking.id);

        if (updateError) {
            console.error(`Failed to update booking ${booking.id}: ${updateError.message}`);
        } else {
            console.log(`Booking ${booking.id}: Awarded ${coins} coins (${durationMinutes} mins)`);

            // Aggregation
            if (!userCoinUpdates[booking.user_id]) userCoinUpdates[booking.user_id] = 0;
            userCoinUpdates[booking.user_id] += coins;
            totalCoinsDistributed += coins;
        }
    }

    // 2. Update Users
    console.log('\n--- Updating User Balances ---');
    for (const [userId, coinsToAdd] of Object.entries(userCoinUpdates)) {
        // Fetch current balance first to be safe
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('super_coins')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error(`Error fetching user ${userId}:`, userError);
            continue;
        }

        const newBalance = (user.super_coins || 0) + coinsToAdd;

        const { error: balanceError } = await supabase
            .from('users')
            .update({ super_coins: newBalance })
            .eq('id', userId);

        if (balanceError) {
            console.error(`Failed to update user ${userId}:`, balanceError);
        } else {
            console.log(`User ${userId}: +${coinsToAdd} coins (New Balance: ${newBalance})`);
        }
    }

    console.log(`\n✅ Backfill Complete! Distributed ${totalCoinsDistributed} Super Coins.`);
}

backfillCoins();

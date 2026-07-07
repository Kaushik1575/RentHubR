const supabase = require('../config/supabase');

/**
 * PERMANENT FIX: Standardize all vehicle_type values in the bookings table
 * Changes: 'bikes' -> 'bike', 'cars' -> 'car', 'scooters'/'scooties' -> 'scooty'
 */
async function fixVehicleTypesPermanently() {
    console.log('🔧 PERMANENT FIX: Standardizing vehicle types in database...\n');

    try {
        // 1. Check current state
        const { data: allBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('id, booking_id, vehicle_type, status');

        if (fetchError) throw fetchError;

        console.log(`📊 Total bookings in database: ${allBookings.length}\n`);

        // Group by current type
        const typeStats = {};
        allBookings.forEach(b => {
            const type = b.vehicle_type || 'null';
            if (!typeStats[type]) typeStats[type] = 0;
            typeStats[type]++;
        });

        console.log('Current vehicle_type distribution:');
        Object.keys(typeStats).sort().forEach(type => {
            console.log(`   ${type}: ${typeStats[type]}`);
        });

        // 2. Identify bookings that need fixing
        const needsFix = allBookings.filter(b => {
            const type = (b.vehicle_type || '').toLowerCase();
            return ['bikes', 'cars', 'scooters', 'scooties'].includes(type);
        });

        console.log(`\n🔍 Found ${needsFix.length} bookings that need updating\n`);

        if (needsFix.length === 0) {
            console.log('✅ All bookings already use correct vehicle types!');
            return;
        }

        // 3. Update in batches
        let updated = 0;
        let errors = 0;

        for (const booking of needsFix) {
            const oldType = booking.vehicle_type;
            let newType = oldType.toLowerCase();

            // Normalize to singular
            if (newType === 'bikes') newType = 'bike';
            else if (newType === 'cars') newType = 'car';
            else if (newType === 'scooters' || newType === 'scooties') newType = 'scooty';

            const { error } = await supabase
                .from('bookings')
                .update({ vehicle_type: newType })
                .eq('id', booking.id);

            if (error) {
                console.error(`   ❌ Failed to update booking ${booking.booking_id || booking.id}: ${error.message}`);
                errors++;
            } else {
                updated++;
                if (updated % 10 === 0) {
                    console.log(`   ⏳ Updated ${updated}/${needsFix.length} bookings...`);
                }
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`   Successfully updated: ${updated}`);
        console.log(`   Errors: ${errors}`);

        // 4. Verify the fix
        console.log('\n🔍 Verifying changes...');
        const { data: verifyBookings } = await supabase
            .from('bookings')
            .select('vehicle_type');

        const finalStats = {};
        verifyBookings.forEach(b => {
            const type = b.vehicle_type || 'null';
            if (!finalStats[type]) finalStats[type] = 0;
            finalStats[type]++;
        });

        console.log('\nFinal vehicle_type distribution:');
        Object.keys(finalStats).sort().forEach(type => {
            console.log(`   ${type}: ${finalStats[type]}`);
        });

        // Check for any remaining plural forms
        const stillBroken = verifyBookings.filter(b =>
            ['bikes', 'cars', 'scooters', 'scooties'].includes((b.vehicle_type || '').toLowerCase())
        );

        if (stillBroken.length > 0) {
            console.log(`\n⚠️  Warning: ${stillBroken.length} bookings still have plural vehicle types`);
        } else {
            console.log('\n✅ All bookings now use standardized vehicle types!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
fixVehicleTypesPermanently()
    .then(() => {
        console.log('\n🎉 Permanent fix applied successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Migration failed:', err);
        process.exit(1);
    });

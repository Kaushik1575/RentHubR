const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSeeding() {
    const logs = [];
    const log = (msg) => { console.log(msg); logs.push(msg); };

    log('Starting Seeding V2...');

    // 1. Check existing 'bikes' table schema by inspecting one row
    const { data: bikes, error: bErr } = await supabase.from('bikes').select('*').limit(1);

    if (bErr) {
        log(`Error fetching bikes: ${bErr.message}`);
        fs.writeFileSync('seed_v2_log.json', JSON.stringify({ error: bErr, logs }, null, 2));
        return;
    }

    if (!bikes || bikes.length === 0) {
        log('No bikes found in DB. Cannot inspect schema or copy data.');
        fs.writeFileSync('seed_v2_log.json', JSON.stringify({ logs }, null, 2));
        return;
    }

    const firstBike = bikes[0];
    const keys = Object.keys(firstBike);
    log(`Bike Schema Keys: ${keys.join(', ')}`);

    if (!keys.includes('sponsor_id')) {
        log('CRITICAL: "sponsor_id" column missing in "bikes" table. Cannot assign to sponsors.');
        log('Please verify table schema.');
        // If possible, we could try to create it via SQL if we had access, but client-side JS cannot alter table easily without rpc/sql function.
    }

    // 2. Fetch all vehicles to copy
    const { data: allBikes } = await supabase.from('bikes').select('*');
    const { data: allCars } = await supabase.from('cars').select('*');
    const { data: allScooties } = await supabase.from('scooty').select('*'); // Check table name 'scooty' vs 'scooties', previous script used 'scooty' and it seemed to find 0? Or errored?

    log(`Found ${allBikes?.length} bikes, ${allCars?.length} cars, ${allScooties?.length} scooties.`);

    // 3. Create/Get Sponsors
    const SPONSORS = [
        { email: 'sponsor1@renthub.com', password: 'password123', name: 'Sponsor One', phone: '1111111111' },
        { email: 'sponsor2@renthub.com', password: 'password123', name: 'Sponsor Two', phone: '2222222222' },
        { email: 'sponsor3@renthub.com', password: 'password123', name: 'Sponsor Three', phone: '3333333333' }
    ];

    const sponsorIds = [];

    for (const s of SPONSORS) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        let uid = users.find(u => u.email === s.email)?.id;

        if (!uid) {
            log(`Creating user ${s.email}...`);
            const { data, error } = await supabase.auth.admin.createUser({
                email: s.email,
                password: s.password,
                email_confirm: true
            });
            if (error) { log(`Failed to create user ${s.email}: ${error.message}`); continue; }
            uid = data.user.id;
        }

        // Ensure profile exists
        const { data: profile } = await supabase.from('sponsors').select('id').eq('id', uid).single();
        if (!profile) {
            await supabase.from('sponsors').insert([{ id: uid, full_name: s.name, email: s.email, phone_number: s.phone, approval_status: 'approved' }]);
        }
        sponsorIds.push(uid);
    }

    if (sponsorIds.length === 0) {
        log('No sponsors available. Exiting.');
        fs.writeFileSync('seed_v2_log.json', JSON.stringify({ logs }, null, 2));
        return;
    }

    // 4. Assign vehicles
    // User wants "4 bike 4 car 4 scooty" per sponsor.
    const vehiclesByType = {
        'bikes': allBikes || [],
        'cars': allCars || [],
        'scooty': allScooties || []
    };

    let insertedCount = 0;
    const insertionErrors = [];

    for (let i = 0; i < sponsorIds.length; i++) {
        const sponsorId = sponsorIds[i];

        for (const type of ['bikes', 'cars', 'scooty']) {
            const available = vehiclesByType[type];
            if (available.length === 0) continue;

            // Pick 4 vehicles (cycling through available)
            for (let j = 0; j < 4; j++) {
                const source = available[(i * 4 + j) % available.length];

                // Prepare new object
                const { id, created_at, sponsor_id: oldSponsor, ...cleanData } = source;

                cleanData.sponsor_id = sponsorId;
                cleanData.is_approved = true;
                cleanData.is_available = true;
                if (cleanData.registration_number) {
                    cleanData.registration_number = `${cleanData.registration_number}-S${i + 1}-${j}`; // Ensure unique
                }

                const { error: insErr } = await supabase.from(type).insert([cleanData]);

                if (insErr) {
                    insertionErrors.push({ type, name: cleanData.name, error: insErr.message });
                } else {
                    insertedCount++;
                }
            }
        }
    }

    log(`Finished. Inserted ${insertedCount} vehicles.`);
    if (insertionErrors.length > 0) {
        log(`Errors: ${insertionErrors.length}. See log file.`);
        fs.writeFileSync('seed_v2_errors.json', JSON.stringify(insertionErrors, null, 2));
    }

    fs.writeFileSync('seed_v2_log.json', JSON.stringify({ logs, keys }, null, 2));
}

runSeeding().catch(err => {
    console.error(err);
    fs.writeFileSync('seed_v2_fatal.json', JSON.stringify(err, null, 2));
});

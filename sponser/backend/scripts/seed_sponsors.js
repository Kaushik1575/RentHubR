const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SPONSORS = [
    { email: 'sponsor1@renthub.com', password: 'password123', name: 'Sponsor One', phone: '9876543210' },
    { email: 'sponsor2@renthub.com', password: 'password123', name: 'Sponsor Two', phone: '9876543211' },
    { email: 'sponsor3@renthub.com', password: 'password123', name: 'Sponsor Three', phone: '9876543212' }
];

async function seedSponsors() {
    console.log('Starting Supabase Seeding...');

    const sponsorIds = [];

    // 1. Create Sponsors
    for (const sponsor of SPONSORS) {
        console.log(`Processing sponsor: ${sponsor.email}`);

        // Check if user exists in auth.users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        let userId = users.find(u => u.email === sponsor.email)?.id;

        if (!userId) {
            console.log(`Creating auth user for ${sponsor.email}...`);
            const { data, error } = await supabase.auth.admin.createUser({
                email: sponsor.email,
                password: sponsor.password,
                email_confirm: true,
                user_metadata: { role: 'sponsor' } // Metadata might be useful
            });

            if (error) {
                console.error(`Error creating user ${sponsor.email}:`, error);
                continue;
            }
            userId = data.user.id;
        } else {
            console.log(`User ${sponsor.email} already exists.`);
        }

        // Check/Create entry in public.sponsors
        const { data: existingSponsor } = await supabase
            .from('sponsors')
            .select('id')
            .eq('id', userId)
            .single();

        if (!existingSponsor) {
            console.log(`Creating sponsor profile for ${userId}...`);
            const { error: insertError } = await supabase
                .from('sponsors')
                .insert([{
                    id: userId,
                    full_name: sponsor.name,
                    email: sponsor.email,
                    phone_number: sponsor.phone,
                    approval_status: 'approved' // Auto-approve for seeding
                }]);

            if (insertError) console.error(`Error creating profile for ${sponsor.email}:`, insertError);
        }

        sponsorIds.push(userId);
    }

    if (sponsorIds.length === 0) {
        console.error('No sponsors created/found. Exiting.');
        return;
    }

    console.log(`Sponsor IDs: ${sponsorIds.join(', ')}`);

    // 2. Fetch Existing Vehicles (Source Data)
    console.log('Fetching source vehicles from DB...');
    const { data: bikes, error: bErr } = await supabase.from('bikes').select('*');
    if (bErr) console.error('Error fetching bikes:', bErr);

    const { data: cars, error: cErr } = await supabase.from('cars').select('*');
    if (cErr) console.error('Error fetching cars:', cErr);

    const { data: scooties, error: sErr } = await supabase.from('scooty').select('*');
    if (sErr) console.error('Error fetching scooty:', sErr);

    console.log(`Bikes found: ${bikes?.length || 0}`);
    if (bikes && bikes.length > 0) {
        console.log('First bike keys:', Object.keys(bikes[0]));
        console.log('First bike data:', bikes[0]);
    }

    console.log(`Cars found: ${cars?.length || 0}`);
    console.log(`Scooties found: ${scooties?.length || 0}`);

    const allVehicles = [
        ...(bikes || []).map(v => ({ ...v, type: 'bikes' })),
        ...(cars || []).map(v => ({ ...v, type: 'cars' })),
        ...(scooties || []).map(v => ({ ...v, type: 'scooty' }))
    ];

    console.log(`Found ${allVehicles.length} vehicles to use as templates.`);

    // If no vehicles found (RentHub DB empty?), use hardcoded templates?
    // User implies RentHub website HAS vehicles.

    if (allVehicles.length === 0) {
        console.warn('No vehicles found in DB! Cannot seed copies.');
        // Optional: define some hardcoded templates here if needed.
        return;
    }

    // 3. Distribute and Insert Copies
    let count = 0;

    // We want 4 bikes, 4 cars, 4 scooties per sponsor if possible.
    // Or just round robin distribution of whatever we found.
    // Let's filter by type first to ensure distribution.
    const sourceTypes = {
        'bikes': allVehicles.filter(v => v.type === 'bikes'),
        'cars': allVehicles.filter(v => v.type === 'cars'),
        'scooty': allVehicles.filter(v => v.type === 'scooty')
    };

    for (let i = 0; i < sponsorIds.length; i++) {
        const sponsorId = sponsorIds[i];
        console.log(`Assigning vehicles to sponsor ${sponsorId}...`);

        const vehiclesToAssign = [];

        // Try to get 4 of each type
        ['bikes', 'cars', 'scooty'].forEach(type => {
            const available = sourceTypes[type];
            // Just take 4 random (or cyclic) ones
            for (let j = 0; j < 4; j++) {
                if (available.length > 0) {
                    // Use modulo to cycle through available templates
                    const template = available[(i * 4 + j) % available.length];
                    vehiclesToAssign.push({ ...template, type });
                }
            }
        });

        // Insert
        for (const v of vehiclesToAssign) {
            const { id, created_at, sponsor_id, type, ...vehicleData } = v;

            // Override sponsor_id
            vehicleData.sponsor_id = sponsorId;
            vehicleData.is_approved = true;
            vehicleData.is_available = true;
            vehicleData.status = 'available'; // Default status if columns exist

            // Clean up potential unique constraints or unwanted fields
            // (Assuming 'registration_number' might need to be unique? 
            // If so, we need to append something. Let's assume seeded data tolerates duplicates or modify it.)
            vehicleData.registration_number = `${v.registration_number}-S${i + 1}`;

            const { error: insertError } = await supabase
                .from(type)
                .insert([vehicleData]);

            if (insertError) {
                console.error(`Error inserting ${type} ${v.name}:`, insertError.message);
            } else {
                count++;
            }
        }
    }

    console.log(`Seeding complete! Inserted ${count} new subscriber vehicles.`);
}

seedSponsors().catch(console.error);

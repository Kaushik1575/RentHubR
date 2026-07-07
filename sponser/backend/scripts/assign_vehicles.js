const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
    console.error('Please ensure your backend/.env file contains these keys.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function assignVehicles() {
    console.log('Starting vehicle assignment process...');
    console.log('Connecting to Supabase...');

    // 1. Fetch Existing Sponsors
    const { data: existingSponsors, error: fetchError } = await supabase
        .from('sponsors')
        .select('*');

    if (fetchError) {
        console.error('Error fetching sponsors:', fetchError.message);
        return;
    }

    let sponsors = [...existingSponsors];
    console.log(`Found ${sponsors.length} existing sponsors.`);

    // 2. Create Dummy Sponsors if fewer than 3
    if (sponsors.length < 3) {
        const needed = 3 - sponsors.length;
        console.log(`Creating ${needed} placeholder sponsors to ensure we have at least 3...`);

        for (let i = 0; i < needed; i++) {
            const num = sponsors.length + i + 1;
            const email = `sponsor${Date.now()}_${num}@example.com`; // Unique email
            const password = 'password123';
            const name = `Sponsor User ${num}`;

            // Create Auth User
            const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (authError) {
                console.error(`Error creating auth user for ${email}:`, authError.message);
                continue;
            }

            // Create Sponsor Profile
            const { data: newSponsor, error: profileError } = await supabase
                .from('sponsors')
                .insert([{
                    id: user.id,
                    full_name: name,
                    email: email,
                    phone_number: `98765432${num.toString().padStart(2, '0')}`,
                    approval_status: 'approved',
                    address: '123 Sponsor Street'
                }])
                .select()
                .single();

            if (profileError) {
                console.error(`Error creating sponsor profile for ${email}:`, profileError.message);
            } else {
                console.log(`Created new sponsor: ${email} (Password: ${password})`);
                sponsors.push(newSponsor);
            }
        }
    }

    // Use only the first 3 sponsors for distribution
    const targetSponsors = sponsors.slice(0, 3);
    console.log(`\nDistributing vehicles among:`);
    targetSponsors.forEach(s => console.log(`- ${s.full_name} (${s.email})`));

    // 3. Distribute Vehicles (Bikes, Cars, Scooty)
    const tables = ['bikes', 'cars', 'scooty'];
    let totalAssigned = 0;
    let globalIndex = 0;

    for (const table of tables) {
        // Fetch all vehicles
        const { data: vehicles, error: vError } = await supabase.from(table).select('*');

        if (vError) {
            console.error(`Error fetching ${table}:`, vError.message);
            continue;
        }

        if (!vehicles || vehicles.length === 0) {
            console.log(`No vehicles found in '${table}' table.`);
            continue;
        }

        console.log(`\nProcessing ${vehicles.length} vehicles in '${table}'...`);

        for (const vehicle of vehicles) {
            // Round-robin assignment
            const sponsor = targetSponsors[globalIndex % targetSponsors.length];

            const { error: updateError } = await supabase
                .from(table)
                .update({
                    sponsor_id: sponsor.id,
                    is_approved: true, // Ensure approved
                    is_available: true
                })
                .eq('id', vehicle.id);

            if (updateError) {
                console.error(`Failed to assign ${table} #${vehicle.id}:`, updateError.message);
            } else {
                // console.log(`Assigned '${vehicle.name}' to ${sponsor.full_name}`);
                totalAssigned++;
            }
            globalIndex++;
        }
    }

    console.log(`\n--------------------------------------------------`);
    console.log(`SUCCESS: Assigned ${totalAssigned} vehicles to ${targetSponsors.length} sponsors.`);
    console.log(`You can now login as one of these sponsors to view 'My Bikes' stats.`);
    targetSponsors.forEach(s => console.log(`- Email: ${s.email} | ID: ${s.id}`));
    console.log(`--------------------------------------------------`);
}

assignVehicles();

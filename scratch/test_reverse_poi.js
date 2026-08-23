const fetch = globalThis.fetch;

async function testReversePOI(lat, lon) {
    console.log(`\n======================================================`);
    console.log(`Testing Reverse Geocode + Area-Specific POI Discovery for: ${lat}, ${lon}`);
    console.log(`======================================================`);

    // Step 1: Reverse Geocode to get locality, city, highway
    const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const revRes = await fetch(revUrl, {
        headers: { 'User-Agent': 'RentHubEmergencyPOI/1.0 (contact@renthub.app)' }
    });
    const revData = await revRes.json();
    const addr = revData.address || {};
    const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.residential || '';
    const city = addr.city || addr.state_district || addr.county || 'Bhubaneswar';
    const road = addr.road || 'Main Road';

    console.log(`📍 Resolved Locality: "${locality}", Road: "${road}", City: "${city}"`);
    console.log(`Full Display Name: ${revData.display_name}`);

    // Step 2: Query Nominatim with locality & bounding box
    const delta = 0.08; // ~8km box
    const searchTerms = [
        `petrol pump ${locality} ${city}`,
        `fuel ${city}`,
        `petrol pump ${city}`
    ];

    let petrolPumps = [];
    for (const term of searchTerms) {
        if (!term.trim()) continue;
        const qUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=5`;
        const res = await fetch(qUrl, {
            headers: { 'User-Agent': 'RentHubEmergencyPOI/1.0 (contact@renthub.app)' }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                petrolPumps = data;
                console.log(`Found ${data.length} places for query "${term}":`);
                data.forEach(d => console.log(`  - ${d.name || d.display_name.split(',')[0]} (${d.lat}, ${d.lon})`));
                break;
            }
        }
    }
}

async function run() {
    await testReversePOI(20.2185, 85.7358);
    await testReversePOI(20.2961, 85.8245);
    await testReversePOI(12.9352, 77.6245);
}

run().catch(console.error);

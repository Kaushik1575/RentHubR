const fetch = globalThis.fetch;

async function testNominatimGarages(lat, lon) {
    console.log(`Testing Nominatim Garage Queries for: ${lat}, ${lon}`);

    const queries = [
        'bike service',
        'motorcycle repair',
        'auto garage',
        'puncture',
        'tyre repair',
        'mechanic',
        'Honda Service',
        'Hero Service',
        'Bajaj Auto',
        'TVS Service',
        'Royal Enfield',
        'two wheeler'
    ];

    const delta = 0.08;
    const found = [];

    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=5`;
            const res = await fetch(url, { headers: { 'User-Agent': 'RentHub-Garages/1.0' } });
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    console.log(`\nQuery "${q}" returned ${data.length} items:`);
                    data.forEach(d => {
                        console.log(`  - "${d.display_name.split(',')[0]}" (${d.lat}, ${d.lon})`);
                        console.log(`    Full: ${d.display_name}`);
                    });
                }
            }
        } catch (e) {}
    }
}

testNominatimGarages(20.2185, 85.7358).catch(console.error);

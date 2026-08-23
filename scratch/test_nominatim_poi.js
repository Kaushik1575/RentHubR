const fetch = globalThis.fetch;

async function testNominatimPlaces(lat, lon) {
    console.log(`Testing Nominatim POI Search for: Lat ${lat}, Lon ${lon}`);

    // Nominatim POI Search for Garages:
    const garageQueries = ['motorcycle repair', 'bike repair', 'mechanic', 'automobile repair'];
    const fuelQueries = ['petrol pump', 'fuel', 'gas station'];

    async function searchPOIs(queries) {
        for (const q of queries) {
            try {
                // 15km bounding box around lat, lon
                const delta = 0.15;
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=5`;
                console.log(`Querying Nominatim: ${url}`);
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'RentHub-Emergency-LiveSearch/1.0 (contact@renthub.app)' }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        return data;
                    }
                }
            } catch (e) {
                console.warn(`Query ${q} failed:`, e.message);
            }
        }
        return [];
    }

    const garages = await searchPOIs(garageQueries);
    console.log(`Found ${garages.length} Garages via Nominatim:`);
    garages.forEach(g => console.log(` - ${g.display_name} (${g.lat}, ${g.lon})`));

    const fuels = await searchPOIs(fuelQueries);
    console.log(`Found ${fuels.length} Petrol Pumps via Nominatim:`);
    fuels.forEach(f => console.log(` - ${f.display_name} (${f.lat}, ${f.lon})`));
}

async function run() {
    // Test for Bhubaneswar (where user tested)
    await testNominatimPlaces(20.2961, 85.8245);
}

run().catch(console.error);

const fetch = globalThis.fetch;

async function testPhoton(lat, lon) {
    console.log(`Testing Photon Elasticsearch POI for: ${lat}, ${lon}`);

    const queries = ['petrol pump', 'fuel', 'bike repair', 'motorcycle', 'garage', 'mechanic', 'puncture'];
    for (const q of queries) {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&limit=5`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(`\nResults for "${q}": ${data.features?.length || 0}`);
                data.features?.forEach(f => {
                    const props = f.properties || {};
                    console.log(` - ${props.name} | ${props.street || props.city || props.district || ''} (${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]})`);
                });
            }
        } catch (e) {
            console.error(`Error for ${q}:`, e.message);
        }
    }
}

testPhoton(20.2185, 85.7358).catch(console.error);

const fetch = globalThis.fetch;

async function testFastOverpass(lat, lon) {
    const query = `[out:json][timeout:15];
(
  node["amenity"="fuel"](around:12000, ${lat}, ${lon});
  way["amenity"="fuel"](around:12000, ${lat}, ${lon});
  node["shop"="motorcycle"](around:12000, ${lat}, ${lon});
  way["shop"="motorcycle"](around:12000, ${lat}, ${lon});
  node["shop"="motorcycle_repair"](around:12000, ${lat}, ${lon});
  way["shop"="motorcycle_repair"](around:12000, ${lat}, ${lon});
  node["shop"="car_repair"](around:12000, ${lat}, ${lon});
  way["shop"="car_repair"](around:12000, ${lat}, ${lon});
  node["craft"="mechanic"](around:12000, ${lat}, ${lon});
  way["craft"="mechanic"](around:12000, ${lat}, ${lon});
);
out center 25;`;

    const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        'https://overpass.private.coffee/api/interpreter'
    ];

    for (const ep of endpoints) {
        console.log(`\nTesting endpoint: ${ep}...`);
        try {
            const res = await fetch(ep, {
                method: 'POST',
                body: 'data=' + encodeURIComponent(query),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'RentHub-App/2.0'
                }
            });
            console.log(`Status from ${ep}: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`Found ${data.elements ? data.elements.length : 0} elements:`);
                if (data.elements) {
                    data.elements.slice(0, 5).forEach(el => {
                        const tags = el.tags || {};
                        console.log(`  - [${tags.amenity || tags.shop || tags.craft}] ${tags.name || tags.brand || 'No Name'} (${el.lat || el.center?.lat}, ${el.lon || el.center?.lon})`);
                    });
                }
            }
        } catch (e) {
            console.warn(`Error on ${ep}:`, e.message);
        }
    }
}

testFastOverpass(20.2961, 85.8245).catch(console.error);

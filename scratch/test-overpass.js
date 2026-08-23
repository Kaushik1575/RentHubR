const fetch = globalThis.fetch || require('node-fetch');

async function testOverpass() {
    const lat = 20.2185;
    const lon = 85.7358;
    const query = `[out:json][timeout:10];
(
  node["amenity"="fuel"](around:8000, ${lat}, ${lon});
  way["amenity"="fuel"](around:8000, ${lat}, ${lon});
  node["shop"="motorcycle_repair"](around:8000, ${lat}, ${lon});
  way["shop"="motorcycle_repair"](around:8000, ${lat}, ${lon});
  node["shop"="motorcycle"](around:8000, ${lat}, ${lon});
  way["shop"="motorcycle"](around:8000, ${lat}, ${lon});
  node["shop"="bicycle"](around:8000, ${lat}, ${lon});
  way["shop"="bicycle"](around:8000, ${lat}, ${lon});
  node["craft"="mechanic"](around:8000, ${lat}, ${lon});
  way["craft"="mechanic"](around:8000, ${lat}, ${lon});
);
out center 15;`;

    console.log('Fetching Overpass API...');
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'RentHub-SOS/1.0'
            }
        });
        const data = await response.json();
        console.log(`Received ${data.elements ? data.elements.length : 0} places!`);
        if (data.elements) {
            data.elements.forEach((el, i) => {
                const name = el.tags?.name || el.tags?.brand || el.tags?.operator || 'Unnamed Place';
                const type = el.tags?.amenity === 'fuel' ? '⛽ Petrol Pump' : '🏍️ Garage/Repair';
                const elLat = el.lat || el.center?.lat;
                const elLon = el.lon || el.center?.lon;
                console.log(`${i + 1}. [${type}] ${name} (${elLat}, ${elLon})`);
            });
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

testOverpass();

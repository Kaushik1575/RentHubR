const fetch = globalThis.fetch;

async function testOSM() {
    // Testing with 3 different locations in India:
    const testLocations = [
        { name: 'Bhubaneswar (GITA)', lat: 20.2185, lon: 85.7358 },
        { name: 'Mumbai (Bandra)', lat: 19.0596, lon: 72.8295 },
        { name: 'Delhi (Connaught Place)', lat: 28.6304, lon: 77.2177 },
        { name: 'Bangalore (Koramangala)', lat: 12.9352, lon: 77.6245 }
    ];

    for (const loc of testLocations) {
        console.log(`\n========================================`);
        console.log(`Testing Real-Time GPS Location: ${loc.name} (${loc.lat}, ${loc.lon})`);
        console.log(`========================================`);

        const query = `[out:json][timeout:10];
(
  node["amenity"="fuel"](around:5000, ${loc.lat}, ${loc.lon});
  way["amenity"="fuel"](around:5000, ${loc.lat}, ${loc.lon});
  node["shop"="motorcycle_repair"](around:7000, ${loc.lat}, ${loc.lon});
  way["shop"="motorcycle_repair"](around:7000, ${loc.lat}, ${loc.lon});
  node["shop"="motorcycle"](around:7000, ${loc.lat}, ${loc.lon});
  way["shop"="motorcycle"](around:7000, ${loc.lat}, ${loc.lon});
  node["craft"="mechanic"](around:7000, ${loc.lat}, ${loc.lon});
  way["craft"="mechanic"](around:7000, ${loc.lat}, ${loc.lon});
);
out center 10;`;

        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'RentHubEmergencyLive/1.0'
            }
        });

        const data = await res.json();
        console.log(`Found ${data.elements.length} real places near ${loc.name}:`);
        data.elements.slice(0, 4).forEach((el, i) => {
            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;
            const tags = el.tags || {};
            const isFuel = tags.amenity === 'fuel';
            const name = tags.name || tags.brand || tags.operator || (isFuel ? 'Petrol Pump' : 'Bike Repair Garage');
            console.log(`  ${i+1}. [${isFuel ? '⛽ Fuel' : '🏍️ Garage'}] ${name} -> Coords: ${lat}, ${lon}`);
            console.log(`     Navigation Map: https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
    }
}

testOSM().catch(console.error);

const fetch = globalThis.fetch;

async function testCleanWorkshops(lat, lon) {
    const q = `[out:json][timeout:15];
(
  node["shop"="motorcycle"](around:10000, ${lat}, ${lon});
  way["shop"="motorcycle"](around:10000, ${lat}, ${lon});
  node["shop"="motorcycle_repair"](around:10000, ${lat}, ${lon});
  way["shop"="motorcycle_repair"](around:10000, ${lat}, ${lon});
  node["shop"="car_repair"](around:10000, ${lat}, ${lon});
  way["shop"="car_repair"](around:10000, ${lat}, ${lon});
  node["shop"="tyres"](around:10000, ${lat}, ${lon});
  way["shop"="tyres"](around:10000, ${lat}, ${lon});
  node["shop"="bicycle"](around:10000, ${lat}, ${lon});
  way["shop"="bicycle"](around:10000, ${lat}, ${lon});
  node["craft"="mechanic"](around:10000, ${lat}, ${lon});
  way["craft"="mechanic"](around:10000, ${lat}, ${lon});
  node["amenity"="fuel"](around:10000, ${lat}, ${lon});
  way["amenity"="fuel"](around:10000, ${lat}, ${lon});
);
out center 40;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (res.ok) {
        const data = await res.json();
        console.log(`Found ${data.elements?.length || 0} real elements:`);
        data.elements?.forEach(el => {
            const tags = el.tags || {};
            const name = tags.name || tags.brand || tags.operator || '';
            const type = tags.amenity === 'fuel' ? '⛽ Fuel' : `🏍️ Workshop (${tags.shop || tags.craft})`;
            const pLat = el.lat || el.center?.lat;
            const pLon = el.lon || el.center?.lon;
            console.log(`- ${type}: "${name || 'Unnamed'}" (${pLat}, ${pLon}) | Addr: ${tags['addr:street'] || tags['addr:suburb'] || ''}`);
        });
    }
}

testCleanWorkshops(20.2185, 85.7358).catch(console.error);

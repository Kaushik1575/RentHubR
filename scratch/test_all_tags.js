const fetch = globalThis.fetch;

async function testAllTags(lat, lon) {
    console.log(`Checking comprehensive tags around: ${lat}, ${lon}`);

    const q = `[out:json][timeout:25];
(
  node["amenity"="fuel"](around:4000, ${lat}, ${lon});
  way["amenity"="fuel"](around:4000, ${lat}, ${lon});
  node["shop"="tyres"](around:4000, ${lat}, ${lon});
  way["shop"="tyres"](around:4000, ${lat}, ${lon});
  node["shop"="motorcycle"](around:4000, ${lat}, ${lon});
  way["shop"="motorcycle"](around:4000, ${lat}, ${lon});
  node["shop"="motorcycle_repair"](around:4000, ${lat}, ${lon});
  way["shop"="motorcycle_repair"](around:4000, ${lat}, ${lon});
  node["shop"="bicycle"](around:4000, ${lat}, ${lon});
  way["shop"="bicycle"](around:4000, ${lat}, ${lon});
  node["shop"="car_repair"](around:4000, ${lat}, ${lon});
  way["shop"="car_repair"](around:4000, ${lat}, ${lon});
  node["craft"="mechanic"](around:4000, ${lat}, ${lon});
  way["craft"="mechanic"](around:4000, ${lat}, ${lon});
  node["amenity"="compressed_air"](around:4000, ${lat}, ${lon});
  node["name"~"Petrol|Fuel|Filling|Garage|Service|Honda|Hero|TVS|Bajaj|Yamaha|Royal Enfield|Auto|Repair|Puncture", i](around:4000, ${lat}, ${lon});
);
out center 40;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (res.ok) {
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log(`Found ${data.elements?.length || 0} elements:`);
            data.elements?.forEach(el => {
                const tags = el.tags || {};
                console.log(`- [${tags.amenity || tags.shop || tags.craft || 'POI'}] "${tags.name || tags.brand || 'No Name'}" (${el.lat || el.center?.lat}, ${el.lon || el.center?.lon})`);
            });
        } catch (e) {
            console.error('Parse error:', e.message);
        }
    } else {
        console.error('Error status:', res.status);
    }
}

testAllTags(20.2185, 85.7358).catch(console.error);

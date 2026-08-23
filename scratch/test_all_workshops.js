const fetch = globalThis.fetch;

async function testAllWorkshops(lat, lon) {
    console.log(`Querying ALL real automotive workshops and mechanics around: ${lat}, ${lon}`);

    const q = `[out:json][timeout:20];
(
  node["shop"~"motorcycle|motorcycle_repair|car_repair|bicycle|tyres|car_parts|repair|car"](around:8000, ${lat}, ${lon});
  way["shop"~"motorcycle|motorcycle_repair|car_repair|bicycle|tyres|car_parts|repair|car"](around:8000, ${lat}, ${lon});
  node["craft"~"mechanic|car_repair|welder|electronics_repair"](around:8000, ${lat}, ${lon});
  way["craft"~"mechanic|car_repair|welder|electronics_repair"](around:8000, ${lat}, ${lon});
  node["amenity"~"vehicle_inspection|car_wash|car_repair|compressed_air"](around:8000, ${lat}, ${lon});
  way["amenity"~"vehicle_inspection|car_wash|car_repair|compressed_air"](around:8000, ${lat}, ${lon});
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
            const name = tags.name || tags.brand || tags.operator || tags['name:en'] || '';
            const type = tags.shop || tags.craft || tags.amenity;
            const pLat = el.lat || el.center?.lat;
            const pLon = el.lon || el.center?.lon;
            console.log(`- [${type}] "${name || 'Unnamed Workshop'}" (${pLat}, ${pLon}) | Street: ${tags['addr:street'] || tags['addr:suburb'] || tags['addr:city'] || ''}`);
        });
    }
}

testAllWorkshops(20.2185, 85.7358).catch(console.error);

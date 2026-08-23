const fetch = globalThis.fetch;

// Let's test multiple methods to get REAL shop names and petrol pump names near a given lat/lon
async function testRealPlacesRetrieval(lat, lon) {
    console.log(`=== Testing Real Places Retrieval for Lat: ${lat}, Lon: ${lon} ===`);

    // 1. Nominatim Structured & Unstructured POI queries with bounding box
    console.log('\n--- 1. Nominatim POI Queries ---');
    const nomQueries = [
        'fuel',
        'petrol pump',
        'Indian Oil',
        'Bharat Petroleum',
        'HP Petrol',
        'motorcycle',
        'garage',
        'bike repair',
        'mechanic',
        'puncture',
        'automobile'
    ];

    const delta = 0.05; // ~5km radius
    for (const q of nomQueries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=5&addressdetails=1`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'RentHub-RealPlaces-Finder/1.0 (contact@renthub.app)' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    console.log(`Query "${q}" returned ${data.length} items:`);
                    data.forEach(item => {
                        console.log(`  - [${item.type || item.class}] ${item.display_name.split(',')[0]} (${item.lat}, ${item.lon}) - Type: ${item.type}`);
                    });
                }
            }
        } catch (e) {
            console.error(`Error in Nominatim for "${q}":`, e.message);
        }
    }

    // 2. Overpass API with fine-grained amenity and shop filters
    console.log('\n--- 2. Overpass API Specific Node Discovery ---');
    const overpassQuery = `[out:json][timeout:15];
(
  node["amenity"="fuel"](around:4000, ${lat}, ${lon});
  way["amenity"="fuel"](around:4000, ${lat}, ${lon});
  node["shop"="motorcycle"](around:4000, ${lat}, ${lon});
  way["shop"="motorcycle"](around:4000, ${lat}, ${lon});
  node["shop"="motorcycle_repair"](around:4000, ${lat}, ${lon});
  way["shop"="motorcycle_repair"](around:4000, ${lat}, ${lon});
  node["shop"="car_repair"](around:4000, ${lat}, ${lon});
  way["shop"="car_repair"](around:4000, ${lat}, ${lon});
  node["craft"="mechanic"](around:4000, ${lat}, ${lon});
  way["craft"="mechanic"](around:4000, ${lat}, ${lon});
  node["shop"="tyres"](around:4000, ${lat}, ${lon});
  way["shop"="tyres"](around:4000, ${lat}, ${lon});
  node["shop"="bicycle"](around:4000, ${lat}, ${lon});
  way["shop"="bicycle"](around:4000, ${lat}, ${lon});
  node["shop"="car_parts"](around:4000, ${lat}, ${lon});
  way["shop"="car_parts"](around:4000, ${lat}, ${lon});
);
out center 30;`;

    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: 'data=' + encodeURIComponent(overpassQuery),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (res.ok) {
            const data = await res.json();
            console.log(`Overpass returned ${data.elements?.length || 0} elements:`);
            data.elements?.forEach(el => {
                const tags = el.tags || {};
                console.log(`  - [${tags.amenity || tags.shop || tags.craft}] Name: "${tags.name || tags.brand || 'No Name'}" | Operator: "${tags.operator || ''}" | Lat: ${el.lat || el.center?.lat}, Lon: ${el.lon || el.center?.lon}`);
            });
        }
    } catch (e) {
        console.error('Error in Overpass:', e.message);
    }
}

// Test with Janla / Madanpur / GITA area: 20.2185, 85.7358
testRealPlacesRetrieval(20.2185, 85.7358).catch(console.error);

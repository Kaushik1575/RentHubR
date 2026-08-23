const fetch = globalThis.fetch;

async function checkDetailedArea(lat, lon) {
    console.log(`Checking exact places around: ${lat}, ${lon}`);

    // Query 1: Overpass with all fuel and vehicle tags within 4km
    const q = `[out:json][timeout:15];
(
  node["amenity"="fuel"](around:5000, ${lat}, ${lon});
  way["amenity"="fuel"](around:5000, ${lat}, ${lon});
  node["shop"](around:5000, ${lat}, ${lon});
  node["craft"](around:5000, ${lat}, ${lon});
);
out center;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = await res.json();
    console.log(`Found ${data.elements ? data.elements.length : 0} total elements within 5km:`);
    if (data.elements) {
        data.elements.forEach(el => {
            const tags = el.tags || {};
            const isFuel = tags.amenity === 'fuel';
            const isShop = tags.shop || tags.craft;
            console.log(`- Type: ${tags.amenity || tags.shop || tags.craft} | Name: "${tags.name || tags.brand || 'No Name'}" | Coords: ${el.lat || el.center?.lat}, ${el.lon || el.center?.lon}`);
        });
    }
}

checkDetailedArea(20.2185, 85.7358).catch(console.error);

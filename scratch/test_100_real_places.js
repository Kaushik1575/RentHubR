const fetch = globalThis.fetch;

// Method 1: Fetching Real Google Maps Live Results by scraping Google Maps search / Places endpoint
async function fetchGoogleMapsLivePlaces(lat, lon, keyword) {
    console.log(`Querying Google Maps live search for "${keyword}" near ${lat}, ${lon}...`);
    try {
        // Google Maps Search URL
        const url = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${lat},${lon},15z/data=!3m1!4b1?hl=en`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const html = await res.text();
        console.log(`HTML response length: ${html.length}`);

        // Google Maps embeds raw place data in window.APP_INITIALIZATION_STATE or window._pageData or JSON arrays in script tags
        // Let's inspect what data is extracted from the HTML!
        const matches = html.match(/\[null,null,[-+]?\d+\.\d+,[-+]?\d+\.\d+\]/g);
        console.log('Coordinate matches in Google Maps response:', matches ? matches.slice(0, 5) : 'None');
    } catch (e) {
        console.error('Google Maps scrape error:', e.message);
    }
}

// Method 2: Comprehensive OpenStreetMap Nominatim + Overpass combined live retrieval
async function fetchOSMRealPlaces(lat, lon) {
    console.log(`\nQuerying OpenStreetMap Nominatim + Overpass for Real Places near ${lat}, ${lon}...`);

    // Let's do a multi-radius Nominatim search with specific keywords
    const queries = [
        'petrol pump',
        'fuel',
        'Indian Oil',
        'Bharat Petroleum',
        'HP',
        'Nayara',
        'bike repair',
        'motorcycle',
        'mechanic',
        'puncture',
        'Honda',
        'Hero',
        'TVS',
        'Bajaj',
        'Royal Enfield',
        'Yamaha',
        'garage',
        'auto repair'
    ];

    const delta = 0.06; // ~6km box
    const foundPlaces = [];
    const seenNames = new Set();

    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=10&addressdetails=1`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'RentHub-Real-Place-Search/3.0 (contact@renthub.app)' }
            });
            if (res.ok) {
                const data = await res.json();
                data.forEach(item => {
                    const rawName = item.display_name.split(',')[0].trim();
                    const pLat = parseFloat(item.lat);
                    const pLon = parseFloat(item.lon);
                    const key = `${rawName.toLowerCase()}_${Math.round(pLat*1000)}_${Math.round(pLon*1000)}`;
                    if (!seenNames.has(key) && rawName.length > 2) {
                        seenNames.add(key);
                        foundPlaces.push({
                            name: rawName,
                            fullAddress: item.display_name,
                            lat: pLat,
                            lon: pLon,
                            type: item.type || item.class
                        });
                    }
                });
            }
        } catch (e) {}
    }

    console.log(`\nFound ${foundPlaces.length} 100% REAL places:`);
    foundPlaces.forEach((p, idx) => {
        console.log(` ${idx+1}. [${p.type}] "${p.name}" (${p.lat}, ${p.lon})`);
        console.log(`    Address: ${p.fullAddress}`);
    });
}

async function run() {
    await fetchOSMRealPlaces(20.2185, 85.7358);
}

run().catch(console.error);

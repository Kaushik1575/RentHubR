const fetch = globalThis.fetch;

// Test scraping Google Maps Search for live, real-world businesses in India
async function searchGoogleMapsLive(lat, lon, query) {
    console.log(`Searching Google Maps for "${query}" near ${lat}, ${lon}...`);
    try {
        // Google Maps Search Mobile Endpoint
        const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lon},14z?hl=en`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!res.ok) {
            console.error('Failed to fetch Google Maps:', res.status);
            return [];
        }

        const html = await res.text();
        console.log(`Received HTML (${html.length} bytes)`);

        // In Google Maps search results, business names and addresses are inside JavaScript array data
        // Example: ["Indian Oil Petrol Pump",null,null,null,null,null,[null,null,20.2325,85.7423]...]
        // Let's inspect extracted place names
        const extracted = [];
        
        // Match business names followed by coordinates or ratings
        const nameMatches = html.match(/\[null,null,null,null,null,null,\["([^"]+)"/g);
        if (nameMatches) {
            nameMatches.forEach(m => {
                const name = m.replace(/\[null,null,null,null,null,null,\["/, '').replace(/"$/, '');
                if (name && name.length > 2 && !name.includes('http') && !extracted.includes(name)) {
                    extracted.push(name);
                }
            });
        }

        console.log(`Extracted ${extracted.length} names for "${query}":`, extracted.slice(0, 8));
        return extracted;
    } catch (e) {
        console.error('Error:', e.message);
        return [];
    }
}

async function run() {
    // Test for user coordinates (Janla / Madanpur / Bhubaneswar area)
    await searchGoogleMapsLive(20.2185, 85.7358, 'petrol pump');
    await searchGoogleMapsLive(20.2185, 85.7358, 'bike garage mechanic');
}

run().catch(console.error);

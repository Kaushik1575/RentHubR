const fetch = globalThis.fetch;

async function inspectHtmlData(lat, lon, query) {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lon},14z?hl=en`;
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();

    // Look for string patterns in the JSON blobs
    // Places usually appear after APP_INITIALIZATION_STATE
    const stateMatch = html.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[.+?\]);\s*window\.APP_FLAGS/s);
    if (stateMatch) {
        console.log('Found APP_INITIALIZATION_STATE!');
        const raw = stateMatch[1];
        console.log('Length:', raw.length);
        
        // Find strings that look like business names or addresses
        const strMatches = raw.match(/"([A-Za-z0-9\s,\.\-&'\(\)\/]{4,50})"/g);
        if (strMatches) {
            console.log(`Found ${strMatches.length} string literals:`);
            const unique = [...new Set(strMatches.map(s => s.replace(/^"|"$/g, '')))];
            const filtered = unique.filter(s => 
                s.includes('Petrol') || s.includes('Oil') || s.includes('Fuel') || 
                s.includes('Auto') || s.includes('Station') || s.includes('Pump') || 
                s.includes('Garage') || s.includes('Motor') || s.includes('Service') ||
                s.includes('Bike') || s.includes('Repair') || s.includes('Honda') || s.includes('Hero')
            );
            console.log('Relevant Place Strings found in Google Maps:', filtered);
        }
    } else {
        console.log('APP_INITIALIZATION_STATE not found directly, searching raw strings in whole HTML...');
        const allStrings = html.match(/"([A-Za-z0-9\s,\.\-&'\(\)\/]{5,50})"/g) || [];
        const unique = [...new Set(allStrings.map(s => s.replace(/^"|"$/g, '')))];
        const filtered = unique.filter(s => 
            s.includes('Petrol') || s.includes('Oil') || s.includes('Fuel') || 
            s.includes('Auto') || s.includes('Station') || s.includes('Pump') || 
            s.includes('Garage') || s.includes('Motor') || s.includes('Service') ||
            s.includes('Bike') || s.includes('Repair')
        );
        console.log('Filtered from raw HTML:', filtered.slice(0, 15));
    }
}

inspectHtmlData(20.2185, 85.7358, 'petrol pump').catch(console.error);

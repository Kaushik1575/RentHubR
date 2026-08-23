const fetch = globalThis.fetch;

async function geocodeAddress(addressText) {
    if (!addressText || typeof addressText !== 'string') return null;
    try {
        const clean = encodeURIComponent(addressText.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${clean}&format=json&limit=1`;
        console.log(`Geocoding query: ${url}`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'RentHub-Geocoding-Service/1.0 (contact@renthub.app)'
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                console.log(`Geocoded "${addressText}" -> Lat: ${lat}, Lon: ${lon} (${data[0].display_name})`);
                return { latitude: lat, longitude: lon };
            }
        }
    } catch (e) {
        console.warn('Geocoding error:', e.message);
    }
    return null;
}

async function test() {
    await geocodeAddress('Patia, Bhubaneswar');
    await geocodeAddress('Koramangala, Bangalore');
    await geocodeAddress('Andheri West, Mumbai');
    await geocodeAddress('Connaught Place, New Delhi');
}

test().catch(console.error);

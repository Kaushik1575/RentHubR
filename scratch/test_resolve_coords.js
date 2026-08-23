const fetch = globalThis.fetch;

async function geocodeAddress(addressText) {
    if (!addressText || typeof addressText !== 'string') return null;
    try {
        const clean = encodeURIComponent(addressText.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${clean}&format=json&limit=1`;
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
                if (!isNaN(lat) && !isNaN(lon)) {
                    return { latitude: lat, longitude: lon, displayName: data[0].display_name };
                }
            }
        }
    } catch (e) {
        console.warn('Geocoding error:', e.message);
    }
    return null;
}

async function resolveCoordinates(input, userIp = null) {
    // 1. Direct Object check
    if (input && typeof input === 'object') {
        const lat = parseFloat(input.latitude || input.lat);
        const lng = parseFloat(input.longitude || input.lng || input.lon);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { latitude: lat, longitude: lng, source: 'gps_device' };
        }
    }

    // 2. String numeric extraction
    if (typeof input === 'string' && input.trim()) {
        const urlMatch = input.match(/(?:q|center|destination|ll)=([-+]?\d+\.?\d*),([-+]?\d+\.?\d*)/i);
        if (urlMatch) {
            const lat = parseFloat(urlMatch[1]);
            const lng = parseFloat(urlMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng, source: 'maps_url' };
        }

        const latMatch = input.match(/Lat(?:itude)?[:=\s]+([-+]?\d+\.?\d*)/i);
        const lngMatch = input.match(/L(?:ng|ong|ongitude)?[:=\s]+([-+]?\d+\.?\d*)/i);
        if (latMatch && lngMatch) {
            const lat = parseFloat(latMatch[1]);
            const lng = parseFloat(lngMatch[1]);
            if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng, source: 'gps_string' };
        }

        const plainMatch = input.match(/([-+]?\d+\.\d+)[,\s]+([-+]?\d+\.\d+)/);
        if (plainMatch) {
            const lat = parseFloat(plainMatch[1]);
            const lng = parseFloat(plainMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng, source: 'coords_string' };
        }

        // 3. If input is a textual place/address name, geocode it!
        const geocoded = await geocodeAddress(input);
        if (geocoded) {
            return { latitude: geocoded.latitude, longitude: geocoded.longitude, source: 'geocoded_address', displayName: geocoded.displayName };
        }
    }

    // 4. IP Geolocation
    if (userIp && userIp !== '127.0.0.1' && userIp !== '::1') {
        try {
            const ipRes = await fetch(`http://ip-api.com/json/${userIp}?fields=status,lat,lon,city,regionName`);
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData.status === 'success' && ipData.lat && ipData.lon) {
                    return { latitude: ipData.lat, longitude: ipData.lon, source: 'ip_lookup', city: ipData.city };
                }
            }
        } catch (e) {
            console.warn('IP geolocate failed:', e.message);
        }
    }

    // Default fallback
    return { latitude: 20.2185, longitude: 85.7358, source: 'default_fallback' };
}

async function testResolution() {
    console.log('Test 1 - Direct GPS Object:', await resolveCoordinates({ latitude: 12.9716, longitude: 77.5946 }));
    console.log('Test 2 - Text Address "Indiranagar, Bangalore":', await resolveCoordinates("Indiranagar, Bangalore"));
    console.log('Test 3 - Text Address "Khandagiri, Bhubaneswar":', await resolveCoordinates("Khandagiri, Bhubaneswar"));
    console.log('Test 4 - Text Address "Saket, New Delhi":', await resolveCoordinates("Saket, New Delhi"));
}

testResolution().catch(console.error);

const fetch = globalThis.fetch;

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0.5;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

// 1. Google Places API Integration (Official & 100% Real-Time)
async function fetchGooglePlacesNearby(lat, lon, keyword, apiKey) {
    if (!apiKey) return [];
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=8000&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                return data.results.map(p => {
                    const pLat = p.geometry.location.lat;
                    const pLon = p.geometry.location.lng;
                    const dist = calculateDistance(lat, lon, pLat, pLon);
                    return {
                        name: p.name,
                        address: p.vicinity || p.formatted_address || 'Nearby Location',
                        rating: p.rating,
                        latitude: pLat,
                        longitude: pLon,
                        distanceKm: dist,
                        distanceText: dist < 1 ? `${Math.round(dist * 1000)} meters away` : `${dist} km away`,
                        phone: 'Call via Google Maps',
                        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`
                    };
                });
            }
        }
    } catch (e) {
        console.warn('Google Places API error:', e.message);
    }
    return [];
}

// 2. OpenStreetMap Nominatim Multi-POI Real Database Retrieval
async function fetchNominatimRealFuel(lat, lon, areaName, roadName) {
    const delta = 0.08;
    const queries = ['petrol pump', 'Indian Oil', 'Bharat Petroleum', 'HP Petrol', 'fuel station'];
    const realFuel = [];
    const seen = new Set();

    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=8`;
            const res = await fetch(url, { headers: { 'User-Agent': 'RentHub/3.0' } });
            if (res.ok) {
                const items = await res.json();
                items.forEach(it => {
                    const rawName = it.display_name.split(',')[0].trim();
                    const pLat = parseFloat(it.lat);
                    const pLon = parseFloat(it.lon);
                    const key = `${rawName}_${Math.round(pLat*100)}_${Math.round(pLon*100)}`;
                    if (!seen.has(key) && rawName.length > 2 && !rawName.toLowerCase().includes('flyover')) {
                        seen.add(key);
                        const dist = calculateDistance(lat, lon, pLat, pLon);
                        const cleanAddr = it.display_name.split(',').slice(1, 4).join(', ').trim();
                        realFuel.push({
                            name: rawName.includes('Petrol') || rawName.includes('Oil') || rawName.includes('Gas') || rawName.includes('Station') || rawName.includes('HP') || rawName.includes('Bharat') ? rawName : `${rawName} Petrol Pump`,
                            type: 'petrol_pump',
                            typeName: '⛽ Fuel Station / Petrol Pump',
                            latitude: pLat,
                            longitude: pLon,
                            distanceKm: dist,
                            distanceText: dist < 1 ? `${Math.round(dist * 1000)} meters away` : `${dist} km away`,
                            address: cleanAddr || `${roadName}, ${areaName}`,
                            phone: '1800-233-3555',
                            mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLon}`
                        });
                    }
                });
            }
        } catch (e) {}
    }

    realFuel.sort((a, b) => a.distanceKm - b.distanceKm);
    return realFuel;
}

console.log('Dual-Engine Architecture (Google Places API + OpenStreetMap Real POI) ready.');

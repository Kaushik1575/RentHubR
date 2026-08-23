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

async function testGaragesAndFuel(lat, lon, label) {
    console.log(`\n======================================================`);
    console.log(`Testing Real Places Retrieval for ${label} (${lat}, ${lon})`);
    console.log(`======================================================`);

    const delta = 0.08; // ~8km box

    // 1. Fetch Real Petrol Pumps
    const fuelKeywords = ['petrol pump', 'Indian Oil', 'Bharat Petroleum', 'HP Petrol', 'fuel station'];
    const petrolPumps = [];
    const seenPumps = new Set();

    for (const kw of fuelKeywords) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(kw)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=10&addressdetails=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'RentHubApp/2.0 (contact@renthub.app)' } });
            if (res.ok) {
                const items = await res.json();
                for (const item of items) {
                    const pLat = parseFloat(item.lat);
                    const pLon = parseFloat(item.lon);
                    const rawName = item.display_name.split(',')[0].trim();
                    const key = `${rawName}_${Math.round(pLat*100)}_${Math.round(pLon*100)}`;
                    if (!seenPumps.has(key)) {
                        seenPumps.add(key);
                        const dist = calculateDistance(lat, lon, pLat, pLon);
                        const addrParts = item.display_name.split(',').slice(1, 4).map(s => s.trim()).filter(Boolean);
                        petrolPumps.push({
                            name: rawName.length > 2 ? rawName : 'Petrol Pump & Fuel Station',
                            lat: pLat,
                            lon: pLon,
                            distanceKm: dist,
                            distanceText: dist < 1 ? `${Math.round(dist * 1000)} meters away` : `${dist} km away`,
                            address: addrParts.join(', ') || 'Nearby Roadside Point',
                            mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLon}`
                        });
                    }
                }
            }
        } catch (e) {}
    }

    // 2. Fetch Real Bike Garages / Repair Shops
    const garageKeywords = [
        'bike repair',
        'motorcycle repair',
        'mechanic',
        'garage',
        'automobile repair',
        'Hero MotoCorp',
        'Honda Service',
        'Bajaj Service',
        'Royal Enfield',
        'puncture',
        'tyre repair',
        'auto service'
    ];
    const garages = [];
    const seenGarages = new Set();

    for (const kw of garageKeywords) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(kw)}&viewbox=${lon-delta},${lat+delta},${lon+delta},${lat-delta}&bounded=1&limit=10&addressdetails=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'RentHubApp/2.0 (contact@renthub.app)' } });
            if (res.ok) {
                const items = await res.json();
                for (const item of items) {
                    const gLat = parseFloat(item.lat);
                    const gLon = parseFloat(item.lon);
                    const rawName = item.display_name.split(',')[0].trim();
                    const key = `${rawName}_${Math.round(gLat*100)}_${Math.round(gLon*100)}`;
                    if (!seenGarages.has(key)) {
                        seenGarages.add(key);
                        const dist = calculateDistance(lat, lon, gLat, gLon);
                        const addrParts = item.display_name.split(',').slice(1, 4).map(s => s.trim()).filter(Boolean);
                        garages.push({
                            name: rawName,
                            lat: gLat,
                            lon: gLon,
                            distanceKm: dist,
                            distanceText: dist < 1 ? `${Math.round(dist * 1000)} meters away` : `${dist} km away`,
                            address: addrParts.join(', ') || 'Nearby Service Point',
                            mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${gLat},${gLon}`
                        });
                    }
                }
            }
        } catch (e) {}
    }

    petrolPumps.sort((a, b) => a.distanceKm - b.distanceKm);
    garages.sort((a, b) => a.distanceKm - b.distanceKm);

    console.log(`\n⛽ REAL PETROL PUMPS FOUND (${petrolPumps.length}):`);
    petrolPumps.slice(0, 5).forEach((p, idx) => {
        console.log(`  ${idx+1}. ${p.name} -> [${p.distanceText}] | Address: ${p.address}`);
    });

    console.log(`\n🏍️ REAL GARAGES / REPAIR SHOPS FOUND (${garages.length}):`);
    garages.slice(0, 5).forEach((g, idx) => {
        console.log(`  ${idx+1}. ${g.name} -> [${g.distanceText}] | Address: ${g.address}`);
    });
}

async function run() {
    await testGaragesAndFuel(20.2185, 85.7358, "Janla / Madanpur (Bhubaneswar outskirts)");
    await testGaragesAndFuel(20.3550, 85.8277, "Patia (Bhubaneswar north)");
    await testGaragesAndFuel(12.9352, 77.6245, "Koramangala (Bangalore)");
}

run().catch(console.error);

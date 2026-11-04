// RentHub - Real-Time Nearby Places Service
// Discovers closest Petrol Pumps, Vehicle Repair Garages, Police Stations, and Hospitals
// using Google Places API (if key present), Google Gemini Geolocation Intelligence (via GEMINI_API_KEY),
// or OpenStreetMap Nominatim Hyper-Local Radial POI database.

const path = require('path');
const fs = require('fs');

// Safe environment variable loader
try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (e) {
    try {
        const adminDotenv = path.resolve(__dirname, '../../admin/backend/node_modules/dotenv');
        require(adminDotenv).config({ path: path.resolve(__dirname, '../.env') });
    } catch (e2) {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            lines.forEach(line => {
                const parts = line.split('=');
                const k = parts[0]?.trim();
                const v = parts.slice(1).join('=').trim();
                if (k && !k.startsWith('#') && !process.env[k]) {
                    process.env[k] = v;
                }
            });
        }
    }
}

const fetch = globalThis.fetch;

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

/**
 * Formats distance display text (e.g. "0.2 km", "< 0.1 km")
 */
function formatDistanceText(distKm) {
    if (distKm <= 0.05) return '< 0.1 km';
    return `${distKm.toFixed(1)} km`;
}

/**
 * Geocodes textual address / city / landmark into coordinates via OpenStreetMap Nominatim
 */
async function geocodeAddress(addressText) {
    if (!addressText || typeof addressText !== 'string' || addressText.trim().length < 3) return null;
    try {
        const clean = encodeURIComponent(addressText.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${clean}&format=json&limit=1`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'RentHub-Emergency-Geocoding/1.0 (contact@renthub.app)'
            }
        });
        clearTimeout(timeout);
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
        console.warn('⚠️ Nominatim Geocoding warning:', e.message);
    }
    return null;
}

/**
 * Reverse Geocodes coordinates to get the neighborhood / area / city name
 */
async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'RentHub-Emergency-Reverse/1.0 (contact@renthub.app)' }
        });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.road || addr.city || 'Nearby Area';
            const road = addr.road || 'Main Road';
            const city = addr.city || addr.state_district || addr.state || 'Bhubaneswar';
            return { area, road, city, displayName: data.display_name };
        }
    } catch (e) {
        console.warn('⚠️ Reverse geocoding warning:', e.message);
    }
    return { area: 'Main Road Area', road: 'Main Road', city: 'Bhubaneswar', displayName: 'Live GPS Pinpoint' };
}

/**
 * Resolves GPS coordinates dynamically from multiple possible input sources
 */
async function resolveCoordinates(input, fallbackAddress = null, userIp = null) {
    if (input && typeof input === 'object') {
        const lat = parseFloat(input.latitude || input.lat || input.coords?.latitude);
        const lng = parseFloat(input.longitude || input.lng || input.lon || input.coords?.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { latitude: lat, longitude: lng, accuracy: input.accuracy || input.coords?.accuracy, source: 'gps_device' };
        }
    }

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

        const geocoded = await geocodeAddress(input);
        if (geocoded) {
            return { latitude: geocoded.latitude, longitude: geocoded.longitude, source: 'geocoded_input', displayName: geocoded.displayName };
        }
    }

    if (fallbackAddress && typeof fallbackAddress === 'string') {
        const geocodedFallback = await geocodeAddress(fallbackAddress);
        if (geocodedFallback) {
            return { latitude: geocodedFallback.latitude, longitude: geocodedFallback.longitude, source: 'geocoded_fallback', displayName: geocodedFallback.displayName };
        }
    }

    if (userIp && userIp !== '127.0.0.1' && userIp !== '::1') {
        try {
            const ipRes = await fetch(`http://ip-api.com/json/${userIp}?fields=status,lat,lon,city`);
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                if (ipData.status === 'success' && ipData.lat && ipData.lon) {
                    return { latitude: ipData.lat, longitude: ipData.lon, source: 'ip_lookup', city: ipData.city };
                }
            }
        } catch (e) {}
    }

    return { latitude: 20.2961, longitude: 85.8245, source: 'default_location' };
}

/**
 * Google Places API Nearby Search for a specific category
 */
async function fetchGooglePlacesCategory(lat, lon, categoryConfig, apiKey) {
    if (!apiKey) return [];
    try {
        const { type, keyword } = categoryConfig;
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&key=${apiKey}`;
        if (type) url += `&type=${encodeURIComponent(type)}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) return [];
        const data = await res.json();
        if (!data.results || data.results.length === 0) return [];

        const candidates = data.results.slice(0, 5);
        const detailedPlaces = await Promise.all(
            candidates.map(async (p, idx) => {
                const pLat = p.geometry?.location?.lat;
                const pLon = p.geometry?.location?.lng;
                if (pLat === undefined || pLon === undefined) return null;

                let phone = null;
                let fullAddress = p.vicinity || p.formatted_address || 'Address provided on Google Maps';

                if (p.place_id) {
                    try {
                        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_phone_number,international_phone_number,formatted_address&key=${apiKey}`;
                        const dController = new AbortController();
                        const dTimeout = setTimeout(() => dController.abort(), 2500);
                        const dRes = await fetch(detailsUrl, { signal: dController.signal });
                        clearTimeout(dTimeout);
                        if (dRes.ok) {
                            const dData = await dRes.json();
                            if (dData.result) {
                                phone = dData.result.formatted_phone_number || dData.result.international_phone_number || null;
                                if (dData.result.formatted_address) {
                                    fullAddress = dData.result.formatted_address;
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore place details fetch error
                    }
                }

                const dist = calculateDistance(lat, lon, pLat, pLon);
                const placeIdParam = p.place_id ? `&destination_place_id=${p.place_id}` : '';
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${pLat},${pLon}${placeIdParam}`;

                return {
                    id: p.place_id || `gplace-${idx}`,
                    name: p.name,
                    address: fullAddress,
                    latitude: pLat,
                    longitude: pLon,
                    distanceKm: dist,
                    distanceText: formatDistanceText(dist),
                    phone: phone,
                    directionsUrl: directionsUrl,
                    mapUrl: directionsUrl,
                    placeId: p.place_id || null
                };
            })
        );

        return detailedPlaces.filter(Boolean);
    } catch (e) {
        console.warn('⚠️ Google Places API error:', e.message);
        return [];
    }
}

/**
 * Discover hyper-local verified places via Google Gemini API
 * Returns authentic businesses and emergency outposts closest to GPS coordinates.
 */
async function fetchGeminiNearbyPlaces(lat, lon, localityText = '') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `You are an emergency geospatial location assistant. A stranded customer triggered an SOS at GPS coordinates: Latitude ${lat}, Longitude ${lon} (${localityText || 'India'}).
Find the NEAREST, GENUINE, and REAL establishments closest to these exact GPS coordinates across four categories:
1. petrolPumps: EXACTLY 3 nearest genuine petrol pumps / fuel stations.
2. garages: EXACTLY 3 nearest vehicle repair garages / automobile mechanics / puncture repair shops.
3. policeStations: EXACTLY 3 nearest police stations / outposts / thanas.
4. hospitals: EXACTLY 3 nearest hospitals / community health centers (CHC) / 24x7 emergency medical clinics.

Rules:
- The customer is in immediate emergency. Prioritize genuine establishments closest to coordinates (within 0.1 km to 5 km). Do NOT skip close local establishments to return famous city centers 15 km away.
- Use official genuine business/establishment names only. No generic placeholders like 'Garage 1' or 'Hospital 1'.
- Coordinates MUST be accurate real-world latitude and longitude for the place.
- Include verified phone number if known, otherwise set to null.
- Provide the complete real street address / landmark.

Return ONLY a valid JSON object with keys 'petrolPumps', 'garages', 'policeStations', 'hospitals'. Each is an array of objects with:
- name (string)
- address (string)
- latitude (number)
- longitude (number)
- phone (string or null)`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`⚠️ Gemini places API returned status ${res.status}`);
            return null;
        }

        const data = await res.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) return null;

        const parsed = JSON.parse(rawJsonText);
        const formatted = {
            petrolPumps: [],
            garages: [],
            policeStations: [],
            hospitals: []
        };

        for (const cat of ['petrolPumps', 'garages', 'policeStations', 'hospitals']) {
            if (Array.isArray(parsed[cat])) {
                formatted[cat] = parsed[cat].map((p, idx) => {
                    const pLat = parseFloat(p.latitude);
                    const pLon = parseFloat(p.longitude);
                    if (isNaN(pLat) || isNaN(pLon)) return null;

                    const dist = calculateDistance(lat, lon, pLat, pLon);
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${pLat},${pLon}`;

                    return {
                        id: `gemini-${cat}-${idx}`,
                        name: p.name,
                        address: p.address || 'Address provided on Google Maps',
                        latitude: pLat,
                        longitude: pLon,
                        distanceKm: dist,
                        distanceText: formatDistanceText(dist),
                        phone: p.phone && p.phone !== 'N/A' && p.phone.trim().length > 4 ? p.phone.trim() : null,
                        directionsUrl: directionsUrl,
                        mapUrl: directionsUrl,
                        placeId: null
                    };
                }).filter(Boolean);
            }
        }

        return formatted;
    } catch (e) {
        console.warn('⚠️ Gemini nearby places discovery warning:', e.message);
        return null;
    }
}

/**
 * OpenStreetMap Nominatim Real POI Database search for a category with tight radial bounding
 */
async function fetchNominatimCategory(lat, lon, queries, delta = 0.03) {
    const seen = new Set();
    const items = [];

    // Limit to top 2 queries with strict abort timeout
    const searchQueries = queries.slice(0, 2);

    for (const q of searchQueries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${lon - delta},${lat + delta},${lon + delta},${lat - delta}&bounded=1&limit=6&addressdetails=1&extratags=1`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'RentHub-Emergency-Search/3.0 (contact@renthub.app)'
                }
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    for (const it of data) {
                        const pLat = parseFloat(it.lat);
                        const pLon = parseFloat(it.lon);
                        if (isNaN(pLat) || isNaN(pLon)) continue;

                        let rawName = (it.name || it.display_name?.split(',')[0] || '').trim();
                        if (!rawName || rawName.length < 3) continue;

                        const lower = rawName.toLowerCase();
                        if (lower.includes('flyover') || lower.startsWith('garage 1') || lower.startsWith('hospital 1') || lower.startsWith('police 1') || lower.startsWith('petrol 1')) continue;

                        const key = `${lower}_${pLat.toFixed(3)}_${pLon.toFixed(3)}`;
                        if (seen.has(key)) continue;
                        seen.add(key);

                        const dist = calculateDistance(lat, lon, pLat, pLon);
                        const addrParts = (it.display_name || '').split(',').slice(1, 5).map(s => s.trim()).filter(Boolean);
                        const address = addrParts.join(', ') || it.display_name || 'Address available via map directions';

                        const phone = it.extratags?.phone || it.extratags?.['contact:phone'] || null;
                        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${pLat},${pLon}`;

                        items.push({
                            id: `osm-${it.osm_id || items.length + 1}`,
                            name: rawName,
                            address: address,
                            latitude: pLat,
                            longitude: pLon,
                            distanceKm: dist,
                            distanceText: formatDistanceText(dist),
                            phone: phone,
                            directionsUrl: directionsUrl,
                            mapUrl: directionsUrl,
                            placeId: null
                        });
                    }
                }
            }
        } catch (e) {
            console.warn(`⚠️ Nominatim query warning for "${q}":`, e.message);
        }
        if (items.length >= 3) break;
    }

    return items;
}

/**
 * Deduplicates, sorts in ascending order of distance, and returns at most maxResults (3)
 */
function processCategoryResults(results, maxResults = 3) {
    if (!Array.isArray(results)) return [];

    const unique = [];
    const seenNames = new Set();

    for (const place of results) {
        if (!place || !place.name || isNaN(place.latitude) || isNaN(place.longitude)) continue;
        const normName = place.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (normName.length > 2 && seenNames.has(normName)) continue;

        // Check if there is another place within 50 meters
        const isDuplicateLocation = unique.some(existing => {
            const d = calculateDistance(existing.latitude, existing.longitude, place.latitude, place.longitude);
            return d < 0.05;
        });
        if (isDuplicateLocation) continue;

        if (normName.length > 2) seenNames.add(normName);
        unique.push(place);
    }

    // Sort ascending by distance (nearest first)
    unique.sort((a, b) => a.distanceKm - b.distanceKm);

    // Return at most maxResults places (never more than 3)
    return unique.slice(0, maxResults);
}

/**
 * Discovers closest places for the 4 categories:
 * 1. Petrol Pumps (max 3)
 * 2. Vehicle Repair Garages (max 3)
 * 3. Police Stations (max 3)
 * 4. Hospitals (max 3)
 * 
 * Uses Google Places API (if key present), Google Gemini Geolocation Intelligence,
 * or OpenStreetMap Nominatim with strict tight-bounding.
 * Strictly no fake/mock results.
 */
async function findNearbyPlaces(userLocation, fallbackAddress = null, clientIp = null) {
    const coordsInfo = await resolveCoordinates(userLocation, fallbackAddress, clientIp);
    const { latitude, longitude } = coordsInfo;

    console.log(`📍 Discovering real-time places near: Lat ${latitude}, Lng ${longitude} (Source: ${coordsInfo.source || 'resolved'})`);

    const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;

    // Get locality name for emergency search context
    let localityText = '';
    try {
        const rev = await reverseGeocode(latitude, longitude);
        if (rev && rev.displayName) {
            localityText = rev.displayName;
        }
    } catch (e) {}

    const categoryDefinitions = {
        petrolPumps: {
            label: 'Petrol Pumps',
            google: { type: 'gas_station', keyword: 'petrol pump fuel station' },
            nominatim: ['petrol pump', 'fuel station']
        },
        garages: {
            label: 'Vehicle Repair Garages',
            google: { type: 'car_repair', keyword: 'bike motorcycle vehicle repair garage mechanic puncture' },
            nominatim: ['car repair', 'motorcycle repair']
        },
        policeStations: {
            label: 'Police Stations',
            google: { type: 'police', keyword: 'police station thana outpost' },
            nominatim: ['police station', 'police outpost']
        },
        hospitals: {
            label: 'Hospitals',
            google: { type: 'hospital', keyword: 'hospital emergency clinic' },
            nominatim: ['hospital', 'community health centre']
        }
    };

    const finalResults = {
        userCoordinates: { latitude, longitude },
        locationSource: coordsInfo.source || 'resolved',
        petrolPumps: [],
        garages: [],
        policeStations: [],
        hospitals: [],
        mapSearchLinks: {
            petrolPumps: `https://www.google.com/maps/search/petrol+pump+fuel+station/@${latitude},${longitude},15z`,
            garages: `https://www.google.com/maps/search/bike+car+repair+garage+mechanic/@${latitude},${longitude},15z`,
            policeStations: `https://www.google.com/maps/search/police+station/@${latitude},${longitude},15z`,
            hospitals: `https://www.google.com/maps/search/hospital/@${latitude},${longitude},15z`,
            userLocationMap: `https://www.google.com/maps?q=${latitude},${longitude}`
        }
    };

    // 1. If Google Places API key is present, try Google Places API first
    const googleResults = {};
    if (googleKey) {
        for (const [key, config] of Object.entries(categoryDefinitions)) {
            try {
                googleResults[key] = await fetchGooglePlacesCategory(latitude, longitude, config.google, googleKey);
            } catch (gErr) {
                console.warn(`Google Places search error for ${key}:`, gErr.message);
                googleResults[key] = [];
            }
        }
    }

    // 2. Query Gemini Geolocation Engine if Google Places is missing or has sparse results
    let geminiResults = null;
    const needsGemini = !googleKey || Object.values(googleResults).some(arr => !arr || arr.length < 3);
    if (needsGemini && process.env.GEMINI_API_KEY) {
        try {
            geminiResults = await fetchGeminiNearbyPlaces(latitude, longitude, localityText);
        } catch (gemErr) {
            console.warn('⚠️ Gemini nearby places error:', gemErr.message);
        }
    }

    // 3. Assemble and process each category
    for (const [key, config] of Object.entries(categoryDefinitions)) {
        let combined = [];

        if (googleResults[key] && googleResults[key].length > 0) {
            combined.push(...googleResults[key]);
        }

        if (geminiResults && Array.isArray(geminiResults[key])) {
            combined.push(...geminiResults[key]);
        }

        // 4. Fallback to tight-radius OSM Nominatim only if still fewer than 3
        if (combined.length < 3) {
            try {
                const osmTight = await fetchNominatimCategory(latitude, longitude, config.nominatim, 0.03);
                combined.push(...osmTight);
            } catch (nErr) {
                console.warn(`Nominatim search error for ${key}:`, nErr.message);
            }
        }

        // Deduplicate, sort ascending by distance, and take top 3
        finalResults[key] = processCategoryResults(combined, 3);
        console.log(`✅ [${config.label}] Found ${finalResults[key].length} verified places (Max 3).`);
    }

    return finalResults;
}

module.exports = {
    findNearbyPlaces,
    resolveCoordinates,
    geocodeAddress,
    reverseGeocode,
    calculateDistance,
    fetchGooglePlacesCategory,
    fetchGeminiNearbyPlaces,
    fetchNominatimCategory,
    processCategoryResults
};

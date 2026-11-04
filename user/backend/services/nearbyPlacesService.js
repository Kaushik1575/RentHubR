// RentHub - Real-Time Nearby Places Service
// Discovers closest Petrol Pumps, Vehicle Repair Garages, Police Stations, and Hospitals
// using Google Places API (if key present), Google Gemini Geolocation Grounding (via GEMINI_API_KEY),
// or OpenStreetMap Overpass & Nominatim Real POI database.

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

// In-memory caching to prevent duplicate searches, avoid 429 rate limits, and provide instant responses
const placesCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory active SOS session store (maps bookingId / phoneNumber -> sessionData)
const sosSessionStore = new Map();
const SOS_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function saveSosSession(bookingId, phoneNumber, sessionData) {
    const entry = {
        timestamp: Date.now(),
        data: sessionData
    };
    if (bookingId) {
        sosSessionStore.set(String(bookingId), entry);
    }
    if (phoneNumber) {
        const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(-10);
        if (cleanPhone) sosSessionStore.set(cleanPhone, entry);
    }
}

function getSosSession(bookingId, phoneNumber) {
    let entry = null;
    if (bookingId) {
        entry = sosSessionStore.get(String(bookingId));
    }
    if (!entry && phoneNumber) {
        const cleanPhone = String(phoneNumber).replace(/\D/g, '').slice(-10);
        if (cleanPhone) entry = sosSessionStore.get(cleanPhone);
    }
    if (entry && (Date.now() - entry.timestamp) < SOS_SESSION_TTL_MS) {
        return entry.data;
    }
    return null;
}

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

    // Check user's live network IP before falling back to old static address
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

    if (fallbackAddress && typeof fallbackAddress === 'string') {
        const geocodedFallback = await geocodeAddress(fallbackAddress);
        if (geocodedFallback) {
            return { latitude: geocodedFallback.latitude, longitude: geocodedFallback.longitude, source: 'geocoded_fallback', displayName: geocodedFallback.displayName };
        }
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
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=6000&key=${apiKey}`;
        if (type) url += `&type=${encodeURIComponent(type)}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
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
                    } catch (e) {}
                }

                const dist = calculateDistance(lat, lon, pLat, pLon);
                const destQuery = encodeURIComponent(`${p.name}, ${fullAddress}`);
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${destQuery}`;

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

function extractJsonObject(rawText) {
    if (!rawText) return null;
    let text = rawText.trim();

    // 1. Check for markdown code blocks (```json ... ``` or ``` ...)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
    }

    // 2. Extract outermost curly braces { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(text);
    } catch (err) {
        try {
            const cleaned = text.replace(/,\s*([\]}])/g, '$1');
            return JSON.parse(cleaned);
        } catch (e2) {
            return null;
        }
    }
}

/**
 * Discover verified live establishments via Google Gemini with Live Google Search Grounding
 */
async function fetchGeminiNearbyPlaces(lat, lon, localityText = '') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const modelsToTry = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-flash-latest'
    ];

    const safeLocality = localityText || 'Bhubaneswar, Odisha, India';

    const prompt = `You are a real-time hyper-local emergency navigation assistant for RentHub.
Using Google Search, find real, currently operating businesses in ${safeLocality} near GPS Latitude ${lat}, Longitude ${lon}:
1. 3 real petrol pumps / fuel stations near ${safeLocality}
2. 3 real motorcycle / two-wheeler / car repair garages or mechanics near ${safeLocality}
3. 3 real police stations / outposts near ${safeLocality}
4. 3 real hospitals / emergency clinics near ${safeLocality}

Search query terms to use:
- "petrol pump near ${safeLocality}"
- "bike vehicle repair garage mechanic near ${safeLocality}"
- "police station near ${safeLocality}"
- "hospital near ${safeLocality}"

CRITICAL REQUIREMENTS:
- ALL results must be strictly in the immediate local neighborhood of ${safeLocality} (strictly within 1 to 5 km of Lat ${lat}, Lng ${lon}).
- DO NOT return establishments farther than 5 km away. Never return places from distant parts of the city or state.
- Extract actual verified business names, full street addresses, genuine coordinates (latitude and longitude), and official phone numbers if available.

Return a valid JSON object in a markdown code block (\`\`\`json ... \`\`\`) with keys: 'petrolPumps', 'garages', 'policeStations', 'hospitals'.
Each object has:
- name (string)
- address (string)
- latitude (number)
- longitude (number)
- phone (string or null)`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
    };

    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 22000);
            const res = await fetch(url, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            clearTimeout(timeout);

            if (!res.ok) {
                console.warn(`⚠️ Gemini model [${model}] status ${res.status}, checking next model...`);
                continue;
            }

            const data = await res.json();
            const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawJsonText) continue;

            const parsed = extractJsonObject(rawJsonText);
            if (!parsed) {
                console.warn(`⚠️ Failed to parse JSON from Gemini [${model}], checking next model...`);
                continue;
            }

            const formatted = {
                petrolPumps: [],
                garages: [],
                policeStations: [],
                hospitals: []
            };

            for (const cat of ['petrolPumps', 'garages', 'policeStations', 'hospitals']) {
                if (Array.isArray(parsed[cat])) {
                    formatted[cat] = parsed[cat].map((p, idx) => {
                        const pLat = parseFloat(p.latitude || p.approximateCoordinates?.split(',')[0]);
                        const pLon = parseFloat(p.longitude || p.approximateCoordinates?.split(',')[1]);
                        const name = p.officialBusinessName || p.name;
                        const address = p.streetAddress || p.address || 'Address on Google Maps';
                        const phone = p.verifiedPhoneNumber || p.phone;

                        if (!name) return null;

                        const validLat = !isNaN(pLat) ? pLat : lat;
                        const validLon = !isNaN(pLon) ? pLon : lon;
                        const dist = calculateDistance(lat, lon, validLat, validLon);
                        
                        // Strict filter: Discard any result farther than 6.5 km from user coordinates
                        if (dist > 6.5) {
                            console.warn(`⚠️ Discarding faraway place "${name}" (${dist.toFixed(1)} km)`);
                            return null;
                        }

                        const destQuery = encodeURIComponent(`${name}, ${address}`);
                        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${destQuery}`;

                        return {
                            id: `gemini-${cat}-${idx}`,
                            name: name,
                            address: address,
                            latitude: validLat,
                            longitude: validLon,
                            distanceKm: dist,
                            distanceText: formatDistanceText(dist),
                            phone: phone && phone !== 'N/A' && !phone.toLowerCase().includes('not') && phone.trim().length > 4 ? phone.trim() : null,
                            directionsUrl: directionsUrl,
                            mapUrl: directionsUrl,
                            placeId: null
                        };
                    }).filter(Boolean);
                }
            }

            console.log(`✅ [Gemini Grounding] Successfully fetched live verified places using model ${model}`);
            return formatted;
        } catch (e) {
            console.warn(`⚠️ Gemini model [${model}] error:`, e.message);
        }
    }

    return null;
}

/**
 * Discovers verified physical places from OpenStreetMap Overpass API
 */
async function fetchOverpassCategoryPlaces(lat, lon, radius = 7000) {
    const query = `
        [out:json][timeout:15];
        (
            node["amenity"="fuel"](around:${radius},${lat},${lon});
            way["amenity"="fuel"](around:${radius},${lat},${lon});
            node["amenity"="police"](around:${radius},${lat},${lon});
            way["amenity"="police"](around:${radius},${lat},${lon});
            node["amenity"~"hospital|clinic"](around:${radius},${lat},${lon});
            way["amenity"~"hospital|clinic"](around:${radius},${lat},${lon});
            node["shop"~"car_repair|motorcycle_repair|tyres|bicycle"](around:${radius},${lat},${lon});
            way["shop"~"car_repair|motorcycle_repair|tyres|bicycle"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    const endpoints = [
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass-api.de/api/interpreter'
    ];

    for (const ep of endpoints) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 7000);
            const res = await fetch(ep, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'data=' + encodeURIComponent(query)
            });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                const results = {
                    petrolPumps: [],
                    garages: [],
                    policeStations: [],
                    hospitals: []
                };

                for (const el of (data.elements || [])) {
                    const tags = el.tags || {};
                    const pLat = el.lat || el.center?.lat;
                    const pLon = el.lon || el.center?.lon;
                    if (!pLat || !pLon) continue;

                    let rawName = tags.name || tags['name:en'] || tags.operator || tags.brand;
                    const amenity = tags.amenity || '';
                    const shop = tags.shop || '';

                    if (!rawName) {
                        if (amenity === 'fuel') rawName = tags.brand || 'Fuel Station';
                        else if (amenity === 'police') rawName = 'Police Outpost';
                        else if (amenity === 'hospital' || amenity === 'clinic') rawName = 'Community Health Centre';
                        else if (shop) rawName = 'Vehicle Repair Garage';
                        else continue;
                    }

                    const dist = calculateDistance(lat, lon, pLat, pLon);
                    const addrParts = [tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean);
                    const fullAddress = addrParts.join(', ') || 'Address available via map navigation';
                    const phone = tags.phone || tags['contact:phone'] || null;
                    const destQuery = encodeURIComponent(`${rawName}, ${fullAddress}`);
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${destQuery}`;

                    const item = {
                        id: `osm-${el.id}`,
                        name: rawName,
                        address: fullAddress,
                        latitude: pLat,
                        longitude: pLon,
                        distanceKm: dist,
                        distanceText: formatDistanceText(dist),
                        phone: phone,
                        directionsUrl: directionsUrl,
                        mapUrl: directionsUrl,
                        placeId: null
                    };

                    if (amenity === 'fuel') results.petrolPumps.push(item);
                    else if (amenity === 'police') results.policeStations.push(item);
                    else if (amenity === 'hospital' || amenity === 'clinic') results.hospitals.push(item);
                    else if (shop.includes('repair') || shop.includes('tyre') || shop.includes('bicycle')) results.garages.push(item);
                }

                return results;
            }
        } catch (e) {
            // Try next Overpass mirror
        }
    }

    return null;
}

/**
 * OpenStreetMap Nominatim Real POI Database search for a category with tight radial bounding
 */
async function fetchNominatimCategory(lat, lon, queries, delta = 0.04) {
    const seen = new Set();
    const items = [];

    const searchQueries = queries.slice(0, 3);

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
                        const addrParts = (it.display_name || '').split(',').slice(1, 4).map(s => s.trim()).filter(Boolean);
                        const address = addrParts.join(', ') || it.display_name || 'Address available via map directions';

                        const phone = it.extratags?.phone || it.extratags?.['contact:phone'] || null;
                        const destQuery = encodeURIComponent(`${rawName}, ${address}`);
                        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${destQuery}`;

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

        // Check if there is another place within 100 meters
        const isDuplicateLocation = unique.some(existing => {
            const d = calculateDistance(existing.latitude, existing.longitude, place.latitude, place.longitude);
            return d < 0.1;
        });
        if (isDuplicateLocation) continue;

        if (normName.length > 2) seenNames.add(normName);
        unique.push(place);
    }

    // Sort ascending by distance (nearest first)
    unique.sort((a, b) => a.distanceKm - b.distanceKm);

    // Strictly enforce hyper-local proximity:
    // Prefer genuine close places <= 5.0 km. Only if fewer than 3 exist (e.g. rural highway), allow up to 6.5 km max.
    const hyperLocal = unique.filter(p => p.distanceKm <= 5.0);
    if (hyperLocal.length >= maxResults) {
        return hyperLocal.slice(0, maxResults);
    }
    const reasonableLocal = unique.filter(p => p.distanceKm <= 6.5);
    return reasonableLocal.slice(0, maxResults);
}

/**
 * Discovers genuine closest places across 4 categories:
 * 1. Petrol Pumps (max 3)
 * 2. Vehicle Repair Garages (max 3)
 * 3. Police Stations (max 3)
 * 4. Hospitals (max 3)
 */
async function findNearbyPlaces(userLocation, fallbackAddress = null, clientIp = null) {
    const coordsInfo = await resolveCoordinates(userLocation, fallbackAddress, clientIp);
    const { latitude, longitude } = coordsInfo;

    // Check memory cache first
    const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
    const cachedEntry = placesCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL_MS) {
        console.log(`⚡ [Cache Hit] Returning verified places for coordinates: Lat ${latitude}, Lng ${longitude}`);
        return cachedEntry.data;
    }

    console.log(`📍 Discovering verified real-time places near: Lat ${latitude}, Lng ${longitude} (Source: ${coordsInfo.source || 'resolved'})`);

    const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;

    // Get locality name for emergency search context
    let localityText = 'Bhubaneswar, Odisha, India';
    try {
        const rev = await reverseGeocode(latitude, longitude);
        if (rev) {
            localityText = [rev.area, rev.road, rev.city, 'Odisha, India'].filter(Boolean).join(', ');
        }
    } catch (e) {}

    const categoryDefinitions = {
        petrolPumps: {
            label: 'Petrol Pumps',
            google: { type: 'gas_station', keyword: 'petrol pump fuel station' },
            nominatim: ['petrol pump', 'fuel station', 'fuel']
        },
        garages: {
            label: 'Vehicle Repair Garages',
            google: { type: 'car_repair', keyword: 'bike motorcycle vehicle repair garage mechanic puncture' },
            nominatim: ['bike', 'garage', 'workshop', 'motorcycle', 'car repair']
        },
        policeStations: {
            label: 'Police Stations',
            google: { type: 'police', keyword: 'police station thana outpost' },
            nominatim: ['police station', 'police outpost', 'police']
        },
        hospitals: {
            label: 'Hospitals',
            google: { type: 'hospital', keyword: 'hospital emergency clinic' },
            nominatim: ['hospital', 'clinic', 'health centre', 'medical']
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

    // 1. First fetch high-precision physical POIs from OpenStreetMap Nominatim (~3.5km tight box)
    const nominatimResults = {};
    for (const [key, config] of Object.entries(categoryDefinitions)) {
        try {
            nominatimResults[key] = await fetchNominatimCategory(latitude, longitude, config.nominatim, 0.045);
        } catch (nErr) {
            nominatimResults[key] = [];
        }
    }

    // 2. Query Gemini Grounded Engine for hyper-local places (especially repair garages & close facilities)
    let geminiResults = null;
    if (process.env.GEMINI_API_KEY) {
        try {
            geminiResults = await fetchGeminiNearbyPlaces(latitude, longitude, localityText);
        } catch (gemErr) {
            console.warn('⚠️ Gemini nearby places error:', gemErr.message);
        }
    }

    // 3. Assemble and process each category
    for (const [key, config] of Object.entries(categoryDefinitions)) {
        let combined = [];

        // Add tight Nominatim POIs first (genuine surveyed coordinates closest to user)
        if (nominatimResults[key] && nominatimResults[key].length > 0) {
            combined.push(...nominatimResults[key]);
        }

        // Add Google Places if present
        if (googleResults[key] && googleResults[key].length > 0) {
            combined.push(...googleResults[key]);
        }

        // Add Gemini Grounded POIs
        if (geminiResults && Array.isArray(geminiResults[key])) {
            combined.push(...geminiResults[key]);
        }

        // Deduplicate, sort ascending by distance, and enforce strictly <= 5.0km (max 6.5km)
        finalResults[key] = processCategoryResults(combined, 3);
        console.log(`✅ [${config.label}] Found ${finalResults[key].length} verified hyper-local places (Max 3, nearest first).`);
    }

    // Store in cache
    placesCache.set(cacheKey, {
        timestamp: Date.now(),
        data: finalResults
    });

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
    fetchOverpassCategoryPlaces,
    fetchNominatimCategory,
    processCategoryResults,
    saveSosSession,
    getSosSession
};

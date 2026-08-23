const { findNearbyPlaces, parseCoordinates, calculateDistance } = require('../user/backend/services/nearbyPlacesService');
const { sendNearestLocationsEmail } = require('../user/backend/config/emailService');

async function verifyAll() {
    console.log('===============================================================');
    console.log('🧪 COMPREHENSIVE 100% VERIFICATION TEST FOR RENTHUB AI SOS');
    console.log('===============================================================\n');

    // TEST 1: GPS Coordinate Parser Tests
    console.log('--- TEST 1: Coordinate Parser ---');
    const testCases = [
        { input: { latitude: 19.0760, longitude: 72.8777 }, expected: { lat: 19.0760, lng: 72.8777 } },
        { input: "Lat: 28.6139, Lng: 77.2090 (Accuracy: 10m)", expected: { lat: 28.6139, lng: 77.2090 } },
        { input: "https://www.google.com/maps?q=12.9716,77.5946", expected: { lat: 12.9716, lng: 77.5946 } },
        { input: "22.5726, 88.3639", expected: { lat: 22.5726, lng: 88.3639 } }
    ];

    let test1Passed = true;
    for (const tc of testCases) {
        const parsed = parseCoordinates(tc.input);
        const match = Math.abs(parsed.latitude - tc.expected.lat) < 0.001 && Math.abs(parsed.longitude - tc.expected.lng) < 0.001;
        console.log(`Input: ${typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}`);
        console.log(`  -> Output: Lat ${parsed.latitude}, Lng ${parsed.longitude} [${match ? '✅ PASS' : '❌ FAIL'}]`);
        if (!match) test1Passed = false;
    }

    // TEST 2: Haversine Distance Calculation Test
    console.log('\n--- TEST 2: Haversine Distance Calculator ---');
    // Distance between GITA (20.2185, 85.7358) and Khandagiri (20.2585, 85.7858) is ~6.9 km
    const dist = calculateDistance(20.2185, 85.7358, 20.2585, 85.7858);
    const distPass = dist > 5 && dist < 8;
    console.log(`Distance between GITA & Khandagiri: ${dist} km [${distPass ? '✅ PASS' : '❌ FAIL'}]`);

    // TEST 3: Real Multi-City Dynamic GPS Discovery Test
    console.log('\n--- TEST 3: Multi-City Real-Time Location Discovery ---');
    const cities = [
        { name: 'Bhubaneswar, Odisha', coords: { latitude: 20.2185, longitude: 85.7358 } },
        { name: 'Koramangala, Bangalore', coords: { latitude: 12.9352, longitude: 77.6245 } },
        { name: 'Connaught Place, Delhi', coords: { latitude: 28.6304, longitude: 77.2177 } },
        { name: 'Bandra, Mumbai', coords: { latitude: 19.0596, longitude: 72.8295 } }
    ];

    let test3Passed = true;
    for (const city of cities) {
        console.log(`\n📍 Fetching Live Places for: ${city.name} (${city.coords.latitude}, ${city.coords.longitude})...`);
        const result = await findNearbyPlaces(city.coords);
        
        console.log(`  • Found ${result.garages.length} Bike Garages:`);
        result.garages.forEach(g => {
            console.log(`    - 🏍️ ${g.name} (${g.distanceText}) | ${g.address}`);
            console.log(`      Map: ${g.mapUrl}`);
        });

        console.log(`  • Found ${result.petrolPumps.length} Petrol Pumps:`);
        result.petrolPumps.forEach(p => {
            console.log(`    - ⛽ ${p.name} (${p.distanceText}) | ${p.address}`);
            console.log(`      Map: ${p.mapUrl}`);
        });

        const hasValidData = result.garages.length > 0 && result.petrolPumps.length > 0;
        if (!hasValidData) test3Passed = false;
    }

    // TEST 4: Email Dispatch & Template Validation
    console.log('\n--- TEST 4: Live Email Dispatch Integration ---');
    const samplePlaces = await findNearbyPlaces({ latitude: 20.2185, longitude: 85.7358 });
    const emailRes = await sendNearestLocationsEmail(
        'jyoti2006@gmail.com',
        'Kaushik Test User',
        {
            bookingId: 'RH-TEST-VERIFY',
            vehicleName: 'Royal Enfield Classic 350'
        },
        samplePlaces
    );
    console.log('Resend Email Delivery Status:', emailRes);
    const test4Passed = emailRes && emailRes.success;

    console.log('\n===============================================================');
    console.log(`SUMMARY:`);
    console.log(`  Test 1 (Coordinate Parser): ${test1Passed ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log(`  Test 2 (Haversine Formula): ${distPass ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log(`  Test 3 (Multi-City Live Places): ${test3Passed ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log(`  Test 4 (Live Email Dispatch): ${test4Passed ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log('===============================================================');
}

verifyAll().catch(console.error);

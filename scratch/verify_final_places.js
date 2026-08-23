const { findNearbyPlaces } = require('../user/backend/services/nearbyPlacesService');

async function verifyFinalOutput() {
    console.log('Testing final nearby places output:');
    const result = await findNearbyPlaces('20.2185, 85.7358');

    console.log('\n--- LOCATIONS SUMMARY ---');
    console.log('Locality:', result.locality);
    console.log('User Coordinates:', result.userCoordinates);

    console.log('\n--- RETRIEVED GARAGES ---');
    result.garages.forEach((g, i) => {
        console.log(`${i+1}. [${g.typeName}] ${g.name}`);
        console.log(`   Distance: ${g.distanceText} (${g.distanceKm} km)`);
        console.log(`   Address: ${g.address}`);
        console.log(`   Phone: ${g.phone}`);
        console.log(`   Direct Nav Link: ${g.mapUrl}`);
    });

    console.log('\n--- RETRIEVED PETROL PUMPS ---');
    result.petrolPumps.forEach((p, i) => {
        console.log(`${i+1}. [${p.typeName}] ${p.name}`);
        console.log(`   Distance: ${p.distanceText} (${p.distanceKm} km)`);
        console.log(`   Address: ${p.address}`);
        console.log(`   Phone: ${p.phone}`);
        console.log(`   Direct Nav Link: ${p.mapUrl}`);
    });
}

verifyFinalOutput().catch(console.error);

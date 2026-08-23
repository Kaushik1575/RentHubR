// Simulating Retell AI Tool Call
const payload = {
    name: 'send_nearest_locations',
    args: {
        booking_id: 'RH-TEST-VERIFY',
        user_email: 'jyoti2006@gmail.com',
        user_name: 'Kaushik',
        vehicle_name: 'Royal Enfield 350'
    },
    call: {
        call_id: 'call_test_123',
        to_number: '+919040757683',
        metadata: {
            booking_id: 'RH-TEST-VERIFY',
            user_email: 'jyoti2006@gmail.com',
            user_name: 'Kaushik',
            vehicle_name: 'Royal Enfield 350',
            gps_location: 'Lat: 20.2185, Lng: 85.7358'
        }
    }
};

console.log('Simulating Retell AI Tool Call with Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\nRetell AI expects immediate { "result": "...", "response": "..." } with HTTP 200 OK.');

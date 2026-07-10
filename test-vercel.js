async function test() {
    const res = await fetch('https://rent-hub-r.vercel.app/api/sos-activate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: 'test_token',
            bookingId: 358,
            gpsLocation: null
        })
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', data);
}
test();

require('dotenv').config();
const { activateSOS } = require('./controllers/sos.controller');

async function test() {
    const req = {
        body: {
            token: 'test',
            bookingId: 'RH260708-161',
            gpsLocation: 'Lat: 20.2961, Lng: 85.8245'
        }
    };

    const res = {
        json: (data) => console.log('Response JSON:', data),
        status: (code) => {
            console.log('Response Status:', code);
            return { json: (data) => console.log('Response JSON:', data) };
        }
    };

    try {
        await activateSOS(req, res);
    } catch (e) {
        console.error('Error:', e);
    }
}
test();

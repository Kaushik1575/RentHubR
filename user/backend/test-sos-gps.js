require('dotenv').config();
const { activateSOS } = require('./controllers/sos.controller');

async function test() {
    const req = {
        body: {
            token: 'test_token',
            bookingId: 358,
            gpsLocation: {
                latitude: 20.2961,
                longitude: 85.8245,
                accuracy: 10
            }
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

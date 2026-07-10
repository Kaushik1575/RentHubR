require('dotenv').config();
const { activateSOS } = require('./controllers/sos.controller');

async function test() {
    const req = {
        body: {
            token: 'test_token_123',
            bookingId: 358,
            gpsLocation: null
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

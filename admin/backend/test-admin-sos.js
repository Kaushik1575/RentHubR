require('dotenv').config();
const { sendSOS } = require('./controllers/admin.controller');

async function test() {
    const req = {
        body: {
            bookingId: 358 // My booking
        }
    };
    const res = {
        json: (data) => console.log('Response JSON:', data),
        status: (code) => {
            console.log('Response Status:', code);
            return { json: (data) => console.log('Response JSON:', data) };
        }
    };
    await sendSOS(req, res);
}
test();

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = process.env.SENDER_NAME || 'RentHub';

async function test() {
    try {
        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: 'randomtest999@mailinator.com',
            subject: 'Test SOS Email',
            html: '<p>This is a test</p>'
        });
        
        if (error) {
            console.error('Error from resend:', error);
        } else {
            console.log('Success:', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
test();

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log('Sending to array of emails...');
    const { data, error } = await resend.emails.send({
        from: `RentHub <${process.env.SENDER_EMAIL}>`,
        to: ['jyoti2006@gmail.com', 'some_random_unverified@gmail.com'],
        subject: 'Test Array',
        html: '<p>Test</p>'
    });
    console.log('Data:', data);
    console.log('Error:', error);
}

test();

require('dotenv').config();
const { Resend } = require('resend');

async function testEmail() {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) throw new Error('NO_API_KEY');

        const resend = new Resend(apiKey);

        console.log('SENDING...');
        const { data, error } = await resend.emails.send({
            from: 'RentHub <onboarding@resend.dev>',
            to: ['delivered@resend.dev'],
            subject: 'Test',
            html: '<p>Test</p>'
        });

        if (error) {
            console.log('FAIL_API_ERROR');
            console.error(JSON.stringify(error));
        } else {
            console.log('SUCCESS_ID:' + data.id);
        }
    } catch (err) {
        console.log('FAIL_EXCEPTION');
        console.error(err.message);
    }
}

testEmail();

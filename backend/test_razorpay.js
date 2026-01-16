require('dotenv').config();
const Razorpay = require('razorpay');

console.log('Testing Razorpay Keys...');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? '******' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'NOT SET');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testConnection() {
    try {
        // Try to fetch payments to valid credentials
        // We limit to 1 just to check auth
        const payments = await razorpay.payments.all({ count: 1 });
        console.log('✅ Connection Successful! Keys are valid.');
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error Code:', error.statusCode);
        console.error('Error Description:', error.error ? error.error.description : error.message);
        if (error.statusCode === 401) {
            console.log('\nPotential Causes:');
            console.log('1. The Key ID or Key Secret is incorrect.');
            console.log('2. The account is inactive/suspended.');
            console.log('3. You are using Live keys in Test mode or vice versa (though SDK handles this, mixing them up is bad).');
        }
    }
}

testConnection();

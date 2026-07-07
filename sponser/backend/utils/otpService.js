const twilio = require('twilio');
const { sendEmail } = require('../config/sponsorEmailService');

// Initialize Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Use verify service if available?
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
try {
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
    }
} catch (error) {
    console.error('Twilio initialization failed:', error);
}

// In-memory OTP store (Use Redis for production)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Send OTP via Email
 */
const sendEmailOtp = async (email) => {
    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, expiry });

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333;">Verify Your Email</h2>
            <p>Your OTP for verification is:</p>
            <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
            <p>This code is valid for 10 minutes.</p>
        </div>
    `;

    try {
        console.log('📧 Attempting to send email OTP to:', email);
        const result = await sendEmail({
            to: email,
            subject: 'Your Verification Code - RentHub Sponsor',
            html: html
        });

        if (result && result.success) {
            console.log('✅ Email OTP sent successfully to:', email);
        } else {
            console.error('❌ Email sending failed:', result?.error);
            throw new Error(result?.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('❌ Exception in sendEmailOtp:', error);
        throw error;
    }

    return otp; // Return for testing/logging
};

/**
 * Send OTP via Mobile (Twilio)
 */
const sendMobileOtp = async (phoneNumber) => {
    // Ensure number has country code (defaults to +91 if missing)
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
        formattedNumber = `+91${formattedNumber}`; // Default to India
    }

    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(phoneNumber, { otp, expiry });

    if (client) {
        try {
            await client.messages.create({
                body: `Your RentHub verification code is: ${otp}. Do not share this with anyone.`,
                from: twilioPhoneNumber,
                to: formattedNumber
            });
            console.log(`SMS sent to ${formattedNumber}`);
        } catch (error) {
            console.error('Twilio SMS failed:', error);
            // Fallback for dev: log OTP
            console.log(`[DEV] Mobile OTP for ${formattedNumber}: ${otp}`);
        }
    } else {
        console.log(`[DEV] Twilio not configured. Mobile OTP for ${formattedNumber}: ${otp}`);
    }

    return otp;
};

/**
 * Verify OTP
 * @param {string} identifier - Email or Phone
 * @param {string} userOtp - The OTP to check
 * @param {boolean} keep - If true, do not delete the OTP after verification (allow re-use)
 */
const verifyOtp = (identifier, userOtp, keep = false) => {
    const record = otpStore.get(identifier);
    if (!record) return false;

    if (Date.now() > record.expiry) {
        otpStore.delete(identifier);
        return false;
    }

    if (record.otp === userOtp) {
        if (!keep) {
            otpStore.delete(identifier); // Clear after use
        }
        return true;
    }

    return false;
};

module.exports = {
    sendEmailOtp,
    sendMobileOtp,
    verifyOtp
};

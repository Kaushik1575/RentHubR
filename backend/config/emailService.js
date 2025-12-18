const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender - needed for Resend (use onboarding@resend.dev for testing without domain)
const SENDER_EMAIL = 'onboarding@jitus.app';
const SENDER_NAME = 'RentHub';

// Generic function to send email via Resend
async function sendEmail({ to, subject, html, attachments }) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html,
            attachments: attachments
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            // Return structure compatible with existing calls
            return { success: false, error: error.message || error };
        }

        console.log('Email sent successfully via Resend:', data.id);
        return { success: true, messageId: data.id };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error: error.message };
    }
}

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}





// Send booking confirmation email
async function sendBookingConfirmationEmail(userEmail, userName, bookingDetails) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hello${userName ? ', ' + userName : ''}!</h2>
          <p>We are excited to let you know that your booking has been <b>confirmed</b> by the RentHub team.</p>
          <h3>Booking Details:</h3>
          <ul>
            <li><b>Vehicle:</b> ${bookingDetails.vehicleName}</li>
            <li><b>Type:</b> ${bookingDetails.vehicleType}</li>
            <li><b>Start Date:</b> ${bookingDetails.startDate}</li>
            <li><b>Start Time:</b> ${bookingDetails.startTime}</li>
            <li><b>Duration:</b> ${bookingDetails.duration} hours</li>
            <li><b>Total Amount:</b> ₹${bookingDetails.totalAmount}</li>
            <li><b>Advance Payment:</b> ₹${bookingDetails.advancePayment}</li>
            <li><b>Remaining Amount:</b> ₹${bookingDetails.remainingAmount}</li>
            <li><b>Confirmation Time:</b> ${bookingDetails.confirmationTime}</li>
          </ul>
          <p>Please ensure you have the remaining amount ready for payment at the time of pickup.</p>
          <p>If you have any questions or need to make changes, please contact us immediately.</p>
          <br>
          <p>Thank you for choosing RentHub!<br>The RentHub Team</p>
          <hr>
          <small>If you find this email in your spam folder, please mark it as 'Not Spam' to help us deliver future emails to your inbox.</small>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: 'Your Booking is Confirmed! - RentHub',
        html: html
    });
}

// Send password reset OTP email
async function sendPasswordResetOTP(userEmail, userName, otp) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hello${userName ? ', ' + userName : ''}!</h2>
          <p>You requested a password reset for your RentHub account.</p>
          <p><b>Your OTP code is:</b> <span style="font-size: 1.5em; color: #1976d2;">${otp}</span></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <br>
          <p>Thank you,<br>The RentHub Team</p>
          <hr>
          <small>If you find this email in your spam folder, please mark it as 'Not Spam' to help us deliver future emails to your inbox.</small>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: 'Your RentHub OTP Code',
        html: html
    });
}

// Send registration OTP email
async function sendRegistrationOTP(userEmail, userName, otp) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hello${userName ? ', ' + userName : ''}!</h2>
          <p>Thanks for signing up for RentHub. Please use the following OTP to verify your email address and complete registration.</p>
          <p><b>Your verification code is:</b> <span style="font-size: 1.5em; color: #1976d2;">${otp}</span></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not try to register, you can ignore this email.</p>
          <br>
          <p>Good luck!<br>The RentHub Team</p>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: 'Verify your email — RentHub registration',
        html: html
    });
}

// Send refund completion email
async function sendRefundCompleteEmail(userEmail, userName, bookingId, amount, refundTime, refundDetails) {
    const detailsString = refundDetails
        ? (typeof refundDetails === 'string'
            ? refundDetails
            : (refundDetails.method === 'upi'
                ? `UPI: ${refundDetails.upiId || ''}`
                : refundDetails.method === 'bank'
                    ? `Bank Account: ${refundDetails.accountHolder || ''} (${refundDetails.accountNumber || ''}), IFSC: ${refundDetails.ifsc || ''}`
                    : JSON.stringify(refundDetails)))
        : 'N/A';

    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hello${userName ? ', ' + userName : ''}!</h2>
          <p>We're happy to let you know that your refund for booking #${bookingId} has been <b>successfully credited</b> to your provided details.</p>
          <ul>
            <li><b>Refund Amount:</b> ₹${amount}</li>
            <li><b>Refund Date:</b> ${refundTime}</li>
            <li><b>Refund Details:</b> ${detailsString}</li>
          </ul>
          <p>If you have any questions, please reply to this email or contact our support team.</p>
          <br>
          <p>Thank you for using RentHub!<br>The RentHub Team</p>
          <hr>
          <small>If you find this email in your spam folder, please mark it as 'Not Spam' to help us deliver future emails to your inbox.</small>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: 'Your RentHub Refund is Complete',
        html: html
    });
}

// Send SOS activation link email to user
async function sendSOSLinkEmail(userEmail, userName, sosLink) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Hello${userName ? ', ' + userName : ''}!</h2>
          <p>We want to ensure your safety during your ride. You can now activate the <b>SOS feature</b> for your current booking.</p>
          <p style="margin: 20px 0;">
            <a href="${sosLink}" style="
              display: inline-block;
              background-color: #dc143c;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              font-size: 1.1em;
            ">Activate SOS</a>
          </p>
          <p><b>How SOS Works:</b></p>
          <ul>
            <li>Click the "Activate SOS" button above to confirm that you need assistance.</li>
            <li>Our admin team will be notified immediately with your booking and location details.</li>
            <li>We will contact you at your registered phone number to provide assistance.</li>
          </ul>
          <p style="color: #666; margin-top: 20px;">If you did not expect this email or don't need SOS assistance, you can safely ignore it.</p>
          <br>
          <p>Stay safe!<br>The RentHub Team</p>
          <hr>
          <small>If you find this email in your spam folder, please mark it as 'Not Spam' to help us deliver future emails to your inbox.</small>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: 'SOS Activation for Your Ride - RentHub',
        html: html
    });
}

// Send SOS alert email to admin
async function sendSOSAlertEmail(adminEmail, sosData) {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #222; background-color: #fff3cd; padding: 20px; border-left: 4px solid #dc143c;">
          <h2 style="color: #dc143c;">⚠️ SOS ALERT - IMMEDIATE ATTENTION REQUIRED ⚠️</h2>
          <hr>
          <h3>Booking Information:</h3>
          <ul>
            <li><b>Booking ID:</b> ${sosData.bookingId}</li>
            <li><b>User Name:</b> ${sosData.userName}</li>
            <li><b>Phone Number:</b> ${sosData.phoneNumber}</li>
            <li><b>Email:</b> ${sosData.userEmail}</li>
          </ul>
          <h3>Vehicle Information:</h3>
          <ul>
            <li><b>Bike/Vehicle Model:</b> ${sosData.bikeModel}</li>
            <li><b>Pickup Location:</b> ${sosData.pickupLocation}</li>
          </ul>
          <h3>SOS Details:</h3>
          <ul>
            <li><b>Activation Timestamp:</b> ${sosData.timestamp}</li>
            <li><b>GPS Location:</b> ${sosData.gpsLocation}</li>
            ${sosData.googleMapsLink ? `
            <li style="margin-top: 10px;">
                <a href="${sosData.googleMapsLink}" target="_blank" style="
                    background-color: #4285F4;
                    color: white;
                    padding: 8px 16px;
                    text-decoration: none;
                    border-radius: 4px;
                    display: inline-block;
                    font-weight: bold;
                ">📍 View on Google Maps</a>
            </li>
            ` : ''}
          </ul>
          <hr>
          <p style="color: #dc143c; font-weight: bold; font-size: 1.1em;">Please contact the user immediately at the provided phone number.</p>
          <p>Log into your admin panel to view full booking details and take necessary action.</p>
          <br>
          <p>RentHub Admin System</p>
        </div>
    `;

    return sendEmail({
        to: adminEmail,
        subject: 'URGENT: SOS Alert from User - RentHub',
        html: html
    });
}

module.exports = {
    generateOTP,
    sendBookingConfirmationEmail,
    sendPasswordResetOTP,
    sendRegistrationOTP,
    sendRefundCompleteEmail,
    sendSOSLinkEmail,
    sendSOSAlertEmail,
    sendEmail,
    SENDER_EMAIL
};
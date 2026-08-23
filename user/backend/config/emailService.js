const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Resend } = require('resend');

// Initialize Resend safely
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Default sender - pulled from .env for production/custom domains
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = process.env.SENDER_NAME || 'RentHub';

// Generic function to send email via Resend
async function sendEmail({ to, subject, html, attachments }) {
    try {
        if (!resend) {
            console.error('❌ Resend API key missing (RESEND_API_KEY). Email skipped.');
            return { success: false, error: 'RESEND_API_KEY missing' };
        }

        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html,
            attachments: attachments
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 30px 0;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                            <!-- Header Area -->
                            <tr>
                                <td align="center" style="background: linear-gradient(45deg, #6e45e2 0%, #88d3ce 100%); padding: 50px 20px;">
                                    <div style="font-size: 60px; margin-bottom: 15px; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.2));">✨</div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Ride Confirmed!</h1>
                                    <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.9; font-weight: 500;">We've got your ride ready, ${userName || 'Valued Customer'}!</p>
                                </td>
                            </tr>
                            
                            <!-- Main Message -->
                            <tr>
                                <td style="padding: 45px 35px;">
                                    <div style="text-align: center; margin-bottom: 35px;">
                                        <div style="display: inline-block; background: #fff8e1; color: #ff8f00; padding: 10px 20px; border-radius: 50px; font-size: 15px; font-weight: 700; border: 1px solid #ffe082; margin-bottom: 20px;">
                                            🌟 PROFESSIONAL BOOKING
                                        </div>
                                        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 auto; max-width: 480px;">
                                            Your booking has been successfully verified by our team. You're all set for an amazing journey with RentHub!
                                        </p>
                                    </div>

                                    <!-- Booking ID Badge -->
                                    <div style="text-align: center; margin-bottom: 40px;">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 10px; font-size: 18px; font-weight: bold; box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);">
                                            📋 Booking ID: ${bookingDetails.bookingId || bookingDetails.booking_id || 'PRO-RH-' + Math.floor(Math.random() * 1000)}
                                        </div>
                                    </div>

                                    <!-- Details Table -->
                                    <table width="100%" style="margin-bottom: 30px; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                                        <tr style="background: #f7fafc;">
                                            <td colspan="2" style="padding: 15px; color: #2d3748; font-weight: 800; border-bottom: 1px solid #e2e8f0; font-size: 17px;">
                                                🏍️ Ride Details
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7; width: 40%;">Vehicle Name</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${bookingDetails.vehicleName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Pickup Date</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${bookingDetails.startDate}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Pickup Time</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${bookingDetails.startTime}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Duration</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${bookingDetails.duration} Hours</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096;">Confirmation Time</td>
                                            <td style="padding: 15px; color: #2d3748; font-weight: 600;">${bookingDetails.confirmationTime || new Date().toLocaleString()}</td>
                                        </tr>
                                    </table>

                                    <!-- Payment Breakdown -->
                                    <table width="100%" style="margin-bottom: 35px; border-collapse: separate; border-spacing: 0; border: 2px solid #38a169; border-radius: 10px; overflow: hidden;">
                                        <tr style="background: #e6fffa;">
                                            <td colspan="2" style="padding: 15px; color: #234e52; font-weight: 800; border-bottom: 1px solid #38a169; font-size: 17px;">
                                                💰 Payment Breakdown
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #4a5568; border-bottom: 1px solid #e6fffa;">Total Ride Cost</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #e6fffa; font-weight: 700;">₹${bookingDetails.totalAmount}</td>
                                        </tr>
                                        <tr style="background: #f0fff4;">
                                            <td style="padding: 15px; color: #4a5568; border-bottom: 1px solid #c6f6d5;">Advance Paid</td>
                                            <td style="padding: 15px; color: #38a169; border-bottom: 1px solid #c6f6d5; font-weight: 800; font-size: 18px;">₹${bookingDetails.advancePayment} ✓</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #2d3748; font-weight: 800;">Payable at Pickup</td>
                                            <td style="padding: 15px; color: #e53e3e; font-weight: 900; font-size: 20px;">₹${bookingDetails.remainingAmount}</td>
                                        </tr>
                                    </table>

                                    <!-- Notice Box -->
                                    <div style="background-color: #ebf8ff; border-radius: 10px; padding: 25px; margin-bottom: 35px; border: 1px solid #bee3f8;">
                                        <h4 style="margin: 0 0 12px 0; color: #2b6cb0; font-size: 16px;">📌 Important Pickup Protocol:</h4>
                                        <ul style="margin: 0; padding-left: 20px; color: #2c5282; line-height: 1.6;">
                                            <li>Bring original Aadhaar & Driving License.</li>
                                            <li>Arrive 10 minutes prior to pickup time.</li>
                                            <li>Follow all safety protocols mentioned in the app.</li>
                                        </ul>
                                    </div>

                                    <!-- Action Links -->
                                    <div style="text-align: center; border-top: 1px solid #edf2f7; padding-top: 35px;">
                                        <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">Need immediate assistance?</p>
                                        <a href="tel:+919040757683" style="display: inline-block; background: #3182ce; color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 10px rgba(49, 130, 206, 0.3);">
                                            📞 Call Support Team (+91 9040757683)
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Bottom Logo/Footer -->
                            <tr>
                                <td align="center" style="background-color: #1a202c; padding: 40px 20px;">
                                    <div style="color: #ffffff; font-size: 20px; font-weight: 800; margin-bottom: 10px;">RentHub</div>
                                    <p style="color: #a0aec0; margin: 0; font-size: 13px;">Your Premium Vehicle Partner</p>
                                    <div style="margin: 20px 0; border-top: 1px solid #2d3748; width: 100px;"></div>
                                    <p style="color: #718096; margin: 0; font-size: 11px;">If you didn't expect this email, please ignore it.</p>
                                    <p style="color: #4a5568; margin: 8px 0 0 0; font-size: 10px; text-transform: uppercase;">© 2026 RentHub. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SOS Alert</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 20px 0;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td align="center" style="background-color: #dc143c; padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">
                                        ⚠️ SOS ALERT
                                    </h1>
                                    <p style="color: #ffcccc; margin: 10px 0 0 0; font-size: 16px;">
                                        IMMEDIATE ACTION REQUIRED
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Main Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <div style="background-color: #fff5f5; border-left: 5px solid #dc143c; padding: 15px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #8a0c24; font-size: 16px;">
                                            <strong>Admin Notice:</strong> A user has triggered an emergency SOS alert. Please verify the situation and contact them immediately.
                                        </p>
                                    </div>

                                    <!-- User Details -->
                                    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0;">User Information</h3>
                                    <table width="100%" style="margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Full Name:</strong></td>
                                            <td style="padding: 8px 0; color: #333;">${sosData.userName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;"><strong>Phone Number:</strong></td>
                                            <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">
                                                <a href="tel:${sosData.phoneNumber}" style="color: #dc143c; text-decoration: none;">${sosData.phoneNumber}</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                                            <td style="padding: 8px 0; color: #333;">${sosData.userEmail}</td>
                                        </tr>
                                    </table>

                                    <!-- URGENT: Call User Button -->
                                    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fff5f5; border-radius: 8px; border: 2px solid #dc143c;">
                                        <p style="margin: 0 0 15px 0; color: #dc143c; font-weight: bold; font-size: 16px;">⚠️ IMMEDIATE ACTION REQUIRED</p>
                                        <a href="tel:${sosData.phoneNumber}" style="background-color: #dc143c; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 20, 60, 0.4);">
                                            📞 CALL USER NOW
                                        </a>
                                        <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Click to dial ${sosData.phoneNumber}</p>
                                    </div>

                                    <!-- Booking Details -->
                                    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Ride Details</h3>
                                    <table width="100%" style="margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #666; width: 40%;"><strong>Booking ID:</strong></td>
                                            <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 16px; background: #eee; padding: 4px 8px; border-radius: 4px; display: inline-block;">${sosData.bookingId}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;"><strong>Vehicle:</strong></td>
                                            <td style="padding: 8px 0; color: #333;">${sosData.bikeModel}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;"><strong>Pickup Point:</strong></td>
                                            <td style="padding: 8px 0; color: #333;">${sosData.pickupLocation}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;"><strong>Alert Time:</strong></td>
                                            <td style="padding: 8px 0; color: #333;">${sosData.timestamp}</td>
                                        </tr>
                                    </table>

                                    <!-- Location -->
                                    <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Location Details</h3>
                                    <p style="color: #555; margin-bottom: 20px;">
                                        <strong>Reported GPS:</strong><br>
                                        ${sosData.gpsLocation}
                                    </p>

                                    ${sosData.googleMapsLink ? `
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${sosData.googleMapsLink}" target="_blank" style="background-color: #0b5cff; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(11, 92, 255, 0.3);">
                                            📍 View Live Location on Maps
                                        </a>
                                    </div>
                                    ` : '<p style="color: #dc143c; text-align: center; font-style: italic;">No specific map link available</p>'}
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #333; color: #fff; padding: 20px; text-align: center; font-size: 14px;">
                                    <p style="margin: 0;">RentHub Emergency Response System</p>
                                    <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">This is an automated priority alert.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail({
        to: adminEmail,
        subject: `🚨 SOS ALERT: Booking #${sosData.bookingId} - User Requesting Help`,
        html: html
    });
}

// Send Vehicle Approval Email to Sponsor
async function sendVehicleApprovedEmail(sponsorEmail, sponsorName, vehicleDetails) {
    const { vehicleName, type, price } = vehicleDetails;

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
            <h1 style="color: #fff; margin: 0; font-size: 26px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Vehicle Approved!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px;">
            <p style="font-size: 16px;">Hello <b>${sponsorName}</b>,</p>
            <p style="font-size: 16px;">Great news! Your vehicle listing has been approved by our admin team and is now <b>LIVE</b> on RentHub.</p>
            
            <div style="background: #f8fbff; padding: 20px; border-radius: 8px; border: 1px solid #e1e8f0; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0f4c81; border-bottom: 1px solid #e1e8f0; padding-bottom: 10px;">Listing Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Vehicle:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right;">${vehicleName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Type:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right; text-transform: capitalize;">${type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Price:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right;">₹${price} / hr</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Status:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #28a745;">Active & Public</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 15px; color: #555;">
                Users can now start booking your vehicle. You will receive notifications for new bookings.
            </p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="https://rent-hub-r.vercel.app/" style="background-color: #0f4c81; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Listing</a>
            </div>
            
            <p style="font-size: 13px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Thank you for partnering with RentHub!<br>
            </p>
          </div>
        </div>
    `;

    return sendEmail({
        to: sponsorEmail,
        subject: `Start Earning! Your ${vehicleName} is Live - RentHub`,
        html: html
    });
}

// Send Ride Completed & Coin Earning Email
async function sendRideCompletedEmail(userEmail, userName, bookingDetails, rewardData) {
    const { bookingId, vehicleName, totalAmount, coinsEarned } = bookingDetails;
    const { totalCoins, coinsNeeded } = rewardData;

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 40px; margin-bottom: 10px;">🪙</div>
            <h1 style="color: #fff; margin: 0; font-size: 28px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">You Earned ${coinsEarned} Reward Points!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Hello <b>${userName}</b>,</p>
            <p style="font-size: 16px;">Thanks for riding with RentHub! Your ride is complete.</p>
            
            <div style="background: #f8fbff; padding: 20px; border-radius: 8px; border: 1px solid #e1e8f0; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0f4c81; border-bottom: 1px solid #e1e8f0; padding-bottom: 10px;">Ride Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Booking ID:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right;">${bookingId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Vehicle:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right;">${vehicleName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #666;">Total Amount:</td>
                        <td style="padding: 5px 0; font-weight: bold; text-align: right;">₹${totalAmount}</td>
                    </tr>
                </table>
            </div>

            <div style="background: #FFFBE6; padding: 20px; border-radius: 8px; border: 1px solid #FFE58F; margin: 20px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #D48806;">🌟 Reward Points Status</h3>
                
                <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                    <div>
                        <div style="font-size: 12px; color: #8c8c8c;">EARNED THIS RIDE</div>
                        <div style="font-size: 24px; font-weight: bold; color: #D48806;">+${coinsEarned}</div>
                    </div>
                    <div style="width: 1px; background: #FFE58F;"></div>
                    <div>
                        <div style="font-size: 12px; color: #8c8c8c;">TOTAL BALANCE</div>
                        <div style="font-size: 24px; font-weight: bold; color: #D48806;">${totalCoins} 🪙</div>
                    </div>
                </div>

                ${coinsNeeded <= 0
            ? `<p style="color: #28a745; font-weight: bold; margin: 10px 0;">🎉 Congratulations! You have enough reward points for a FREE 2-Hour Ride!</p>
                       <a href="https://rent-hub-r.vercel.app/rewards" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redeem Now</a>`
            : `<p style="margin: 10px 0; color: #555;">You are only <b>${coinsNeeded} points</b> away from a FREE Ride!</p>
                       <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 10px;">
                           <div style="background: #D48806; height: 100%; width: ${Math.min(100, (totalCoins / 1000) * 100)}%;"></div>
                       </div>
                       <p style="font-size: 12px; color: #888; margin-top: 5px;">Goal: 1000 Points</p>`
                }
            </div>
            
            <p style="font-size: 13px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Happy Riding!<br>Team RentHub
            </p>
          </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: `You Earned Reward Points! - RentHub`,
        html: html
    });
}

async function sendNewOfferEmail(userEmail, userName, offerDetails, isUpdate = false) {
    const { 
        title, description, code, discount_percentage, flat_discount, 
        image_url, valid_until, valid_from, target_category,
        valid_from_hour, valid_to_hour, valid_days
    } = offerDetails;

    const discountValue = discount_percentage ? `${discount_percentage}%` : `₹${flat_discount}`;
    const expiryDate = valid_until ? new Date(valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Limited Time';
    
    const isFuture = valid_from && new Date(valid_from) > new Date();
    const startDateText = valid_from 
        ? new Date(valid_from).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) 
        : 'Instant';

    const accentColor = isFuture ? '#6366f1' : '#f59e0b'; // Indigo for Future, Amber for Live
    const secondaryColor = isFuture ? '#4f46e5' : '#d97706';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} | RentHub</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                * { font-family: 'Outfit', sans-serif; }
                .main-card { box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 40px 10px;">
                        <!-- Logo Header -->
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="margin-bottom: 25px;">
                            <tr>
                                <td align="center">
                                    <div style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -1px;">
                                        RentHub<span style="color: ${accentColor};">.</span>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Main Content Card -->
                        <table class="main-card" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
                            <!-- Banner Image -->
                            <tr>
                                <td style="position: relative; height: 300px; overflow: hidden; background-color: #000;">
                                    <img src="${image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800'}" 
                                         alt="Offer Banner" 
                                         style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
                                    
                                    <!-- Status Badge Overlay -->
                                    <div style="position: absolute; top: 20px; left: 20px; background: ${isFuture ? 'rgba(99, 102, 241, 0.9)' : 'rgba(245, 158, 11, 0.9)'}; 
                                                backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2);">
                                        <span style="color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
                                            ${isFuture ? '🚀 Launching Soon' : '✨ Live Now'}
                                        </span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Content Section -->
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                    ${isFuture ? `
                                        <div style="display: inline-block; background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 12px 24px; border-radius: 16px; margin-bottom: 25px;">
                                            <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Mark Your Calendar</div>
                                            <div style="font-size: 22px; font-weight: 800; color: #1e1b4b;">${startDateText}</div>
                                        </div>
                                    ` : ''}

                                    <h1 style="margin: 0 0 15px 0; font-size: 38px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -1px;">
                                        ${title}
                                    </h1>
                                    <p style="margin: 0; font-size: 17px; color: #64748b; line-height: 1.6; max-width: 450px; margin-left: auto; margin-right: auto;">
                                        ${description}
                                    </p>
                                </td>
                            </tr>

                            <!-- Coupon/Discount Section -->
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 20px; padding: 35px; text-align: center;">
                                        <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px;">Exclusive Benefit</div>
                                        <div style="font-size: 72px; font-weight: 800; color: ${accentColor}; line-height: 1; margin-bottom: 5px; letter-spacing: -2px;">
                                            ${discountValue} <span style="font-size: 24px; color: #94a3b8; font-weight: 400; letter-spacing: 0;">OFF</span>
                                        </div>
                                        <div style="font-size: 14px; color: #64748b; font-weight: 500; margin-bottom: 30px;">${isFuture ? `Unlocks at ${startDateText}` : 'Ready for your next ride!'}</div>

                                        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; display: inline-block; padding: 12px 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                            <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Promo Code</div>
                                            <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 800; color: ${isFuture ? '#cbd5e1' : '#0f172a'}; letter-spacing: 5px;">
                                                ${isFuture ? '••••••' : code}
                                            </div>
                                        </div>
                                        ${isFuture ? `<div style="font-size: 11px; color: #6366f1; font-weight: 600; margin-top: 12px;">⏰ Set your reminder for the big reveal!</div>` : ''}
                                    </div>
                                </td>
                            </tr>

                            <!-- Details Grid -->
                            <tr>
                                <td style="padding: 20px 40px 40px 40px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f1f5f9; padding-top: 30px;">
                                        <tr>
                                            <td width="50%" style="padding-bottom: 20px;">
                                                <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">🛡️ Category</div>
                                                <div style="font-size: 14px; font-weight: 600; color: #334155;">${target_category}</div>
                                            </td>
                                            <td width="50%" style="padding-bottom: 20px;">
                                                <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📅 Valid Days</div>
                                                <div style="font-size: 14px; font-weight: 600; color: #334155;">Available weekly</div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td width="50%">
                                                <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">⏳ Valid Until</div>
                                                <div style="font-size: 14px; font-weight: 600; color: #334155;">${expiryDate}</div>
                                            </td>
                                            <td width="50%">
                                                <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">⚡ Status</div>
                                                <div style="font-size: 14px; font-weight: 700; color: ${accentColor};">${isFuture ? 'Upcoming' : 'Active'}</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA Button -->
                                    <div style="margin-top: 40px;">
                                        <a href="https://rent-hub-r.vercel.app/" style="display: block; background-color: #0f172a; color: #ffffff; padding: 20px; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 16px; text-align: center; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);">
                                            ${isFuture ? 'View Launch Details' : 'Book Your Ride Now'}
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer Features -->
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="margin-top: 30px;">
                            <tr>
                                <td align="center" style="padding: 20px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0;">
                                    <table width="100%">
                                        <tr>
                                            <td align="center" width="33%">
                                                <div style="font-size: 20px; margin-bottom: 5px;">🚀</div>
                                                <div style="font-size: 10px; font-weight: 700; color: #64748b;">Fast Pickup</div>
                                            </td>
                                            <td align="center" width="33%">
                                                <div style="font-size: 20px; margin-bottom: 5px;">🛡️</div>
                                                <div style="font-size: 10px; font-weight: 700; color: #64748b;">Safe Rides</div>
                                            </td>
                                            <td align="center" width="33%">
                                                <div style="font-size: 20px; margin-bottom: 5px;">💎</div>
                                                <div style="font-size: 10px; font-weight: 700; color: #64748b;">Premium Care</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <!-- Legal Footer -->
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="margin-top: 40px; text-align: center;">
                            <tr>
                                <td>
                                    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">
                                        © 2026 RentHub Inc. | 123 Luxury Way, Metro City
                                    </p>
                                    <div style="margin-bottom: 20px;">
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 10px;">Privacy</a>
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 10px;">Terms</a>
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 10px;">Unsubscribe</a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail({
        to: userEmail,
        subject: isFuture 
            ? `🚀 NEXT BIG THING: ${discountValue} OFF Launching Soon!` 
            : (isUpdate 
                ? `🔄 UPDATE: Your Exclusive Reward is Ready` 
                : `🎁 SPECIAL GIFT: Your ${discountValue} OFF Invitation`),
        html: html
    });
}

async function sendBookingCancelledEmail(userEmail, userName, bookingId, vehicleName) {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://rent-hub-r.vercel.app').replace(/\/$/, '');
    const refundLink = `${frontendUrl}/my-bookings`;

    const html = `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Booking Cancelled</h2>
          </div>
          <div style="padding: 25px;">
            <p>Hello <b>${userName || 'Valued Customer'}</b>,</p>
            <p>Your booking request <b>#${bookingId}</b> for <b>${vehicleName || 'Vehicle'}</b> has been cancelled.</p>
            <p>If an advance payment was made, click the button below to submit your refund details (UPI ID / Bank Account) directly in <b>My Bookings</b>:</p>
            <p style="text-align: center; margin: 25px 0;">
              <a href="${refundLink}" style="background-color: #0b5cff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Submit Refund Details in My Bookings</a>
            </p>
            <p style="font-size: 13px; color: #666;">Booking ID: <b>${bookingId}</b></p>
            <p style="font-size: 13px; color: #666;">If you did not initiate this cancellation, you can also re-confirm your booking directly from My Bookings.</p>
            <br>
            <p>Thank you,<br>The RentHub Team</p>
          </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: `Booking #${bookingId} Cancelled - RentHub Refund Details`,
        html: html
    });
}

/**
 * Send email to customer with nearest bike garages and petrol pumps with Google Maps navigation links
 */
async function sendNearestLocationsEmail(userEmail, userName, bookingDetails = {}, nearbyData = {}) {
    const { garages = [], petrolPumps = [], userCoordinates = {}, mapSearchLinks = {} } = nearbyData;
    const vehicleName = bookingDetails.vehicleName || bookingDetails.bikeModel || 'Vehicle';
    const bookingId = bookingDetails.bookingId || bookingDetails.id || 'Active Ride';

    const renderGaragesHtml = garages.map((g, idx) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 700; font-size: 16px; color: #1e293b;">
                    ${idx + 1}. ${g.name}
                </div>
                <span style="display: inline-block; background: #ecfdf5; color: #059669; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid #a7f3d0;">
                    📍 ${g.distanceText}
                </span>
            </div>
            <p style="margin: 4px 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
                ${g.address}
                ${g.phone ? `<br><strong style="color: #334155;">📞 Phone:</strong> <a href="tel:${g.phone}" style="color: #2563eb; text-decoration: none;">${g.phone}</a>` : ''}
            </p>
            <div style="text-align: right;">
                <a href="${g.mapUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                    🗺️ Open Navigation in Maps &rarr;
                </a>
            </div>
        </div>
    `).join('');

    const renderPetrolPumpsHtml = petrolPumps.map((p, idx) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 700; font-size: 16px; color: #1e293b;">
                    ${idx + 1}. ${p.name}
                </div>
                <span style="display: inline-block; background: #fffbeb; color: #d97706; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid #fde68a;">
                    ⛽ ${p.distanceText}
                </span>
            </div>
            <p style="margin: 4px 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.4;">
                ${p.address}
                ${p.phone ? `<br><strong style="color: #334155;">📞 Phone:</strong> <a href="tel:${p.phone}" style="color: #2563eb; text-decoration: none;">${p.phone}</a>` : ''}
            </p>
            <div style="text-align: right;">
                <a href="${p.mapUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                    🧭 Navigate to Fuel Station &rarr;
                </a>
            </div>
        </div>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nearest Bike Garages & Petrol Pumps - RentHub Emergency</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td align="center" style="padding: 30px 10px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                            
                            <!-- Header Banner -->
                            <tr>
                                <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 20px; color: #ffffff;">
                                    <div style="display: inline-block; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                                        🚨 Live Emergency Assistance
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                                        Nearest Garages & Petrol Pumps
                                    </h1>
                                    <p style="margin: 0; font-size: 14px; opacity: 0.85; max-width: 450px;">
                                        Locations detected around your live GPS coordinates for <strong>${vehicleName}</strong> (Booking #${bookingId})
                                    </p>
                                </td>
                            </tr>

                            <!-- Main Body -->
                            <tr>
                                <td style="padding: 30px 25px; background: #f8fafc;">
                                    <p style="font-size: 15px; margin: 0 0 20px 0; color: #334155; line-height: 1.5;">
                                    <!-- Top Live Radar Quick Launchers -->
                                    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 18px; margin-bottom: 25px; text-align: center; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                        <div style="color: #38bdf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                                            🎯 100% Real-Time Radar Map (Instant 1-Tap View)
                                        </div>
                                        <h3 style="color: #ffffff; margin: 0 0 14px 0; font-size: 17px; font-weight: 800;">
                                            Open All Nearby Help Directly in Google Maps
                                        </h3>
                                        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                                            <a href="${mapSearchLinks.allPetrolPumps || `https://www.google.com/maps/search/petrol+pump+fuel+station/@${userCoordinates.latitude || 20.2185},${userCoordinates.longitude || 85.7358},16z`}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 10px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; margin: 4px; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.4);">
                                                ⛽ All Live Petrol Pumps Near Me &rarr;
                                            </a>
                                            <a href="${mapSearchLinks.allGarages || `https://www.google.com/maps/search/bike+garage+two+wheeler+mechanic+puncture+repair/@${userCoordinates.latitude || 20.2185},${userCoordinates.longitude || 85.7358},16z`}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 10px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; margin: 4px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);">
                                                🏍️ All Bike Garages & Mechanics Near Me &rarr;
                                            </a>
                                            <a href="https://www.google.com/maps/search/puncture+tyre+repair/@${userCoordinates.latitude || 20.2185},${userCoordinates.longitude || 85.7358},16z" target="_blank" style="display: inline-block; background: #334155; color: #f1f5f9; padding: 10px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; margin: 4px; border: 1px solid #475569;">
                                                🛞 Puncture & Air Stations &rarr;
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Section 1: Bike Garages -->
                                    <div style="margin-bottom: 25px;">
                                        <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">
                                            <h2 style="margin: 0; font-size: 18px; color: #1e3a8a; font-weight: 800;">
                                                🏍️ Nearest Bike Garages & Mechanics
                                            </h2>
                                        </div>
                                        ${renderGaragesHtml || '<p style="color: #64748b; font-size: 14px;">No garage found in immediate 1km. Please use the Google Maps search button above.</p>'}
                                    </div>

                                    <!-- Section 2: Petrol Pumps -->
                                    <div style="margin-bottom: 25px;">
                                        <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 2px solid #f97316; padding-bottom: 6px;">
                                            <h2 style="margin: 0; font-size: 18px; color: #9a3412; font-weight: 800;">
                                                ⛽ Nearest Petrol Pumps & Fuel Stations
                                            </h2>
                                        </div>
                                        ${renderPetrolPumpsHtml || '<p style="color: #64748b; font-size: 14px;">No petrol pump found in immediate 1km. Please use the Google Maps search button above.</p>'}
                                    </div>

                                    <!-- Human Helpline Box -->
                                    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 5px solid #ef4444; border-radius: 8px; padding: 18px; text-align: center;">
                                        <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 16px; font-weight: 800;">🚨 Still Facing Issues? Speak with Response Control</h4>
                                        <p style="margin: 0 0 12px 0; color: #7f1d1d; font-size: 13px;">Our 24x7 Roadside Dispatch Team is standing by to help you.</p>
                                        <a href="tel:+919040757683" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);">
                                            📞 Call 24x7 Control Room (+91 9040757683)
                                        </a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 25px 20px; color: #94a3b8; font-size: 12px;">
                                    <div style="color: #ffffff; font-size: 18px; font-weight: 800; margin-bottom: 6px;">RentHub Emergency Response</div>
                                    <p style="margin: 0 0 6px 0;">Automated AI GPS Roadside Dispatch System</p>
                                    <p style="margin: 0; color: #64748b; font-size: 11px;">© 2026 RentHub Inc. Ride safe and wear your helmet at all times.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail({
        to: userEmail,
        subject: `📍 [Nearest Locations] Bike Garages & Petrol Pumps near you - Booking #${bookingId}`,
        html: html
    });
}

module.exports = {
    generateOTP,
    sendBookingConfirmationEmail,
    sendBookingCancelledEmail,
    sendPasswordResetOTP,
    sendRegistrationOTP,
    sendRefundCompleteEmail,
    sendSOSLinkEmail,
    sendSOSAlertEmail,
    sendNearestLocationsEmail,
    sendRideCompletedEmail,
    sendVehicleApprovedEmail,
    sendNewOfferEmail,
    sendEmail,
    SENDER_EMAIL
};
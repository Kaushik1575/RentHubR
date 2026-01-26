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
                                        <a href="tel:9040757683" style="display: inline-block; background: #3182ce; color: white; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 10px rgba(49, 130, 206, 0.3);">
                                            📞 Call Support Team
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

// Send Ride Completed & Coin Earning Email
async function sendRideCompletedEmail(userEmail, userName, bookingDetails, rewardData) {
    const { bookingId, vehicleName, totalAmount, coinsEarned } = bookingDetails;
    const { totalCoins, coinsNeeded } = rewardData;

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 40px; margin-bottom: 10px;">🪙</div>
            <h1 style="color: #fff; margin: 0; font-size: 28px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">You Earned ${coinsEarned} Super Coins!</h1>
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
                <h3 style="margin: 0 0 10px 0; color: #D48806;">🌟 Super Coin Status</h3>
                
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
            ? `<p style="color: #28a745; font-weight: bold; margin: 10px 0;">🎉 Congratulations! You have enough coins for a FREE 2-Hour Ride!</p>
                       <a href="https://rent-hub-r.vercel.app/rewards" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redeem Now</a>`
            : `<p style="margin: 10px 0; color: #555;">You are only <b>${coinsNeeded} coins</b> away from a FREE Ride!</p>
                       <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 10px;">
                           <div style="background: #D48806; height: 100%; width: ${Math.min(100, (totalCoins / 1000) * 100)}%;"></div>
                       </div>
                       <p style="font-size: 12px; color: #888; margin-top: 5px;">Goal: 1000 Coins</p>`
        }
            </div>

            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
                Keep riding to earn more! <br>
                RenderHub - Your Journey, Our Priority.
            </p>
          </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject: `You Earned ${coinsEarned} Coins! - Booking #${bookingId}`,
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
    sendRideCompletedEmail,
    sendEmail,
    SENDER_EMAIL
};
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
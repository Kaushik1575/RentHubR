const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@jitus.app';
const SENDER_NAME = 'RentHub';

// Generic function to send email via Resend
const sendEmail = async ({ to, subject, html, attachments }) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing in env');
            return { success: false, error: 'RESEND_API_KEY missing' };
        }

        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: Array.isArray(to) ? to : [to],
            // force using string subject even if logic passes other types
            subject: String(subject),
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
};

// Send Vehicle Approval Email to Sponsor
const sendVehicleApprovedEmail = async (sponsorEmail, sponsorName, vehicleDetails) => {
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

// Send Withdrawal Paid Email
const sendWithdrawalPaidEmail = async (sponsorEmail, sponsorName, payload) => {
    const { amount, transactionReference, date, paymentMethod, bankName } = payload;

    const formattedAmount = Number(amount).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR'
    });

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%); padding: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">💸</div>
            <h1 style="color: #fff; margin: 0; font-size: 26px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">Withdrawal Processed!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px;">
            <p style="font-size: 16px;">Hello <b>${sponsorName}</b>,</p>
            <p style="font-size: 16px;">We have successfully processed your withdrawal request. The funds have been transferred to your account.</p>
            
            <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; border: 1px solid #bae6fd; margin: 25px 0; text-align: center;">
                <p style="margin: 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
                <h2 style="margin: 10px 0 0 0; color: #0284c7; font-size: 32px; font-weight: 800;">${formattedAmount}</h2>
            </div>
            
            <div style="background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 16px;">Transaction Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Reference ID:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right; font-family: monospace; font-size: 14px;">${transactionReference || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Date:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">${new Date(date).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Method:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right; text-transform: capitalize; font-size: 14px;">${paymentMethod}</td>
                    </tr>
                     ${bankName ? `
                    <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">Bank:</td>
                        <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">${bankName}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <p style="font-size: 14px; color: #777; line-height: 1.5;">
                Please allow up to 24 hours for the funds to reflect in your account, depending on your bank's processing time.
            </p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="https://rent-hub-r.vercel.app/" style="color: #0d6efd; font-weight: bold; text-decoration: none;">Go to Dashboard &rarr;</a>
            </div>
          </div>
          
           <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e1e8f0;">
             <p style="font-size: 12px; color: #999; margin: 0;">RentHub Finance Team</p>
           </div>
        </div>
    `;

    return sendEmail({
        to: sponsorEmail,
        subject: `Payment Processed: ${formattedAmount} (Ref: ${transactionReference || 'N/A'}) - RentHub`,
        html: html
    });
}

// Send Welcome Email to New Sponsor
const sendWelcomeEmail = async (sponsorEmail, sponsorName) => {
    const frontendUrl = process.env.SPONSOR_FRONTEND_URL || 'https://sponser-seven.vercel.app';
    const addVehicleUrl = `${frontendUrl.replace(/\/$/, '')}/add-bike`;
    const loginUrl = `${frontendUrl.replace(/\/$/, '')}/login`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to RentHub</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    
                    <!-- Main Container -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                        
                        <!-- Header / Banner -->
                        <tr>
                            <td style="background-color: #1a1a2e; padding: 40px 40px; text-align: center; background-image: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">RentHub</h1>
                                <p style="color: #4cc9f0; margin: 10px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Sponsor Program</p>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 40px 40px 20px;">
                                <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Welcome, ${sponsorName}! 👋</h2>
                                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    We're thrilled to have you join the RentHub Partner Network. You've just taken the first step towards turning your vehicle into a passive income machine.
                                </p>
                                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                    Before you start listing, here is a quick summary of how our partnership works:
                                </p>
                            </td>
                        </tr>

                        <!-- Info Cards (2 Columns) -->
                        <tr>
                            <td style="padding: 0 40px 30px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="48%" valign="top" style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eeeeee;">
                                            <div style="font-size: 24px; margin-bottom: 10px;">💰</div>
                                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #333;">70% Earnings</h3>
                                            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">You keep the lion's share of every booking fee.</p>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" valign="top" style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eeeeee;">
                                            <div style="font-size: 24px; margin-bottom: 10px;">🛠️</div>
                                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #333;">Maintenance</h3>
                                            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">You maintain the vehicle; we handle the bookings.</p>
                                        </td>
                                    </tr>
                                    <tr><td height="15"></td></tr>
                                    <tr>
                                        <td width="48%" valign="top" style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eeeeee;">
                                            <div style="font-size: 24px; margin-bottom: 10px;">📄</div>
                                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #333;">Documents</h3>
                                            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">Valid RC, Insurance & PUC are mandatory.</p>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" valign="top" style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px solid #eeeeee;">
                                            <div style="font-size: 24px; margin-bottom: 10px;">🏦</div>
                                            <h3 style="margin: 0 0 5px; font-size: 16px; color: #333;">Fast Payouts</h3>
                                            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">Withdraw earnings directly to your bank.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- CTA Button -->
                        <tr>
                            <td align="center" style="padding: 10px 40px 40px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="border-radius: 50px; background-color: #4cc9f0;">
                                            <a href="${addVehicleUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #1a1a2e; text-decoration: none; border-radius: 50px; font-weight: bold; background-color: #4cc9f0; border: 1px solid #4cc9f0;">
                                                Add Your First Vehicle
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 20px 0 0; color: #999; font-size: 13px;">
                                    Please <a href="${loginUrl}" style="color: #666; text-decoration: underline;">login</a> to access your dashboard.
                                </p>
                            </td>
                        </tr>

                        <!-- Support Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 30px 40px; border-top: 1px solid #eeeeee;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="60%">
                                            <p style="margin: 0 0 5px; font-size: 14px; font-weight: bold; color: #333;">Need Assistance?</p>
                                            <p style="margin: 0; font-size: 13px; color: #666;">Our dedicated sponsor support team is ready to help.</p>
                                        </td>
                                        <td width="40%" align="right">
                                            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; display: inline-block;">
                                                <a href="tel:9040757683" style="text-decoration: none; color: #333; font-weight: bold; font-size: 14px;">📞 9040757683</a>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Copyright -->
                        <tr>
                            <td style="text-align: center; padding: 20px; font-size: 12px; color: #aaaaaa;">
                                &copy; ${new Date().getFullYear()} RentHub Inc. All rights reserved.
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
        to: sponsorEmail,
        subject: `Welcome to the Team, ${sponsorName}! 🚀`,
        html: html
    });
};

module.exports = {
    sendVehicleApprovedEmail,
    sendWithdrawalPaidEmail,
    sendWelcomeEmail,
    sendEmail
};

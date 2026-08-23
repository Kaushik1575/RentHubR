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

function getStageInfo(stageNumber, requestData = {}) {
    const trackingId = requestData.tracking_id || `RH-REQ-${requestData.id || '1001'}`;
    const sponsorUrl = process.env.SPONSOR_FRONTEND_URL || 'https://renthub-sponsor.onrender.com';
    const timelineUrl = `${sponsorUrl}/my-bikes?track=${trackingId}`;

    switch (stageNumber) {
        case 1:
            return {
                stageNumber: 1,
                stageName: "Submitted & Received",
                stageTitle: "✅ Application Successfully Submitted",
                stageDescription: "We have received your bike listing application and all uploaded documents (RC, Insurance, PUC). Our verification team has started reviewing your submission.",
                actionButtonText: "📍 Track Application Timeline",
                actionButtonUrl: timelineUrl
            };
        case 2:
            return {
                stageNumber: 2,
                stageName: "Document & Vehicle Review",
                stageTitle: "🔍 Document Verification Completed",
                stageDescription: "Our verification team has successfully verified your RC, Insurance, PUC, and photos. Your vehicle is cleared for physical survey.",
                actionButtonText: "📍 View Timeline Status",
                actionButtonUrl: timelineUrl
            };
        case 3:
            return {
                stageNumber: 3,
                stageName: "Physical Survey Scheduled",
                stageTitle: "🏠 Physical Survey Scheduled",
                stageDescription: `RentHub team has scheduled a physical inspection visit for your bike at your registered location. Inspection date: ${requestData.survey_scheduled_date || 'Upcoming (Team will contact you)'}.`,
                actionButtonText: "📍 View Survey Details",
                actionButtonUrl: timelineUrl
            };
        case 4:
            return {
                stageNumber: 4,
                stageName: "Survey Inspection Report",
                stageTitle: "📋 Physical Survey Report Generated",
                stageDescription: "The physical survey for your bike is complete. Overall condition rating: Grade A.",
                detailsHtml: requestData.survey_report ? `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px;">Inspection Scorecard:</h4>
                        <div style="font-size: 13px; color: #15803d; line-height: 1.6;">
                            • <strong>Tyres:</strong> ${requestData.survey_report.tyres || 'Good (85%)'}<br/>
                            • <strong>Brakes:</strong> ${requestData.survey_report.brakes || 'Tested & Working'}<br/>
                            • <strong>Engine:</strong> ${requestData.survey_report.engine || 'Smooth Performance'}<br/>
                            • <strong>Lights & Electricals:</strong> ${requestData.survey_report.lights || 'Fully Functional'}
                        </div>
                    </div>
                ` : '',
                actionButtonText: "📍 View Full Inspection Report",
                actionButtonUrl: timelineUrl
            };
        case 5:
            return {
                stageNumber: 5,
                stageName: "Price & Revenue Decision",
                stageTitle: "💰 Proposed Rental Price & Revenue Split Ready",
                stageDescription: `RentHub team has evaluated your bike and proposed a rental pricing plan. Proposed Rental: ₹${requestData.pricing_terms?.proposed_price || requestData.price || 65}/hr with a ${requestData.pricing_terms?.sponsor_percentage || 70}% sponsor revenue payout.`,
                detailsHtml: `
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 18px; margin-bottom: 20px; text-align: center;">
                        <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 15px;">Proposed Revenue Terms:</h4>
                        <div style="display: flex; justify-content: space-around; margin: 10px 0;">
                            <div>
                                <span style="font-size: 12px; color: #78350f; display: block;">Hourly Rental</span>
                                <strong style="font-size: 18px; color: #b45309;">₹${requestData.pricing_terms?.proposed_price || requestData.price || 65}/hr</strong>
                            </div>
                            <div>
                                <span style="font-size: 12px; color: #78350f; display: block;">Your Revenue Share</span>
                                <strong style="font-size: 18px; color: #16a34a;">${requestData.pricing_terms?.sponsor_percentage || 70}%</strong>
                            </div>
                        </div>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #92400e;">Please review and digitally accept the agreement in your Sponsor Portal.</p>
                    </div>
                `,
                actionButtonText: "🤝 Review & Accept Agreement →",
                actionButtonUrl: timelineUrl
            };
        case 6:
            return {
                stageNumber: 6,
                stageName: "Sponsor Agreement Accepted",
                stageTitle: "🤝 Sponsor Agreement Digitally Signed",
                stageDescription: "You have successfully accepted the pricing and commission terms. The digital onboarding agreement is now active.",
                actionButtonText: "📍 View Active Contract",
                actionButtonUrl: timelineUrl
            };
        case 7:
            return {
                stageNumber: 7,
                stageName: "Contract Activated",
                stageTitle: "✅ Vehicle Onboarding Contract Activated",
                stageDescription: "Your vehicle onboarding contract has been officially activated. GPS hardware tracker fitment is the final step before launch.",
                actionButtonText: "📍 View Timeline Status",
                actionButtonUrl: timelineUrl
            };
        case 8:
            return {
                stageNumber: 8,
                stageName: "GPS Installation",
                stageTitle: "📍 GPS Tracker Hardware Installed & Paired",
                stageDescription: `RentHub high-precision anti-theft GPS tracker has been successfully installed and paired with live tracking systems. Device IMEI: ${requestData.gps_tracking?.device_imei || '864209048123456'}.`,
                actionButtonText: "📍 View Live GPS Status",
                actionButtonUrl: timelineUrl
            };
        case 9:
            return {
                stageNumber: 9,
                stageName: "Bike Goes LIVE",
                stageTitle: "🟢 Your Bike is LIVE & Ready for Bookings!",
                stageDescription: "Congratulations! Your bike is now officially published to the RentHub customer fleet and is actively generating rental revenue for you.",
                detailsHtml: `
                    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 6px 0; color: #15803d; font-size: 18px;">🎉 Earning Started!</h3>
                        <p style="margin: 0; color: #166534; font-size: 14px;">Customers can now book your bike in real time. Track all live rides and payout balances directly in your revenue dashboard.</p>
                    </div>
                `,
                actionButtonText: "🚀 Open Sponsor Fleet Dashboard →",
                actionButtonUrl: timelineUrl
            };
        default:
            return {
                stageNumber: 1,
                stageName: "In Review",
                stageTitle: "Application Status Update",
                stageDescription: "Your application is being processed by the RentHub team.",
                actionButtonText: "📍 View Timeline",
                actionButtonUrl: timelineUrl
            };
    }
}

async function sendSponsorTimelineEmail(sponsorEmail, sponsorName, vehicleData, stageNumberOrInfo) {
    if (!sponsorEmail) return { success: false, error: 'No sponsor email provided' };

    const stageInfo = typeof stageNumberOrInfo === 'number' 
        ? getStageInfo(stageNumberOrInfo, vehicleData) 
        : stageNumberOrInfo;

    const {
        stageNumber,
        stageName,
        stageTitle,
        stageDescription,
        actionButtonText,
        actionButtonUrl,
        detailsHtml
    } = stageInfo;

    const progressPercentage = Math.round((stageNumber / 9) * 100);
    const trackingId = vehicleData.tracking_id || `RH-REQ-${vehicleData.id || '1001'}`;
    const vehicleName = vehicleData.name || 'Your Vehicle';
    const regNumber = vehicleData.registration_number || vehicleData.bikeNumber || 'In Verification';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vehicle Onboarding Status Update</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 30px 10px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                            <!-- Top Hero Banner -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 35px 30px; text-align: center; color: #ffffff;">
                                    <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 50px; padding: 6px 16px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px;">
                                        🏍️ SPONSOR ONBOARDING PIPELINE
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff;">Application Update</h1>
                                    <p style="margin: 0; font-size: 15px; color: #c7d2fe; font-weight: 500;">
                                        Tracking ID: <strong style="color: #fbbf24; letter-spacing: 1px;">${trackingId}</strong>
                                    </p>
                                </td>
                            </tr>

                            <!-- Progress Bar Card -->
                            <tr>
                                <td style="padding: 25px 30px 15px 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <span style="font-size: 13px; font-weight: 700; color: #4338ca; text-transform: uppercase;">
                                            Stage ${stageNumber} of 9: ${stageName}
                                        </span>
                                        <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${progressPercentage}% Complete</span>
                                    </div>
                                    <div style="background-color: #e2e8f0; height: 10px; border-radius: 10px; overflow: hidden;">
                                        <div style="background: linear-gradient(90deg, #4f46e5, #10b981); height: 100%; width: ${progressPercentage}%; border-radius: 10px;"></div>
                                    </div>
                                </td>
                            </tr>

                            <!-- Main Body Content -->
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px; margin: 0 0 15px 0;">Hello <strong>${sponsorName || 'Valued Sponsor'}</strong>,</p>
                                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                                        Your bike onboarding application for <strong>${vehicleName}</strong> (${regNumber}) has progressed to the next milestone:
                                    </p>

                                    <!-- Current Stage Highlight Box -->
                                    <div style="background: #eef2ff; border-left: 5px solid #4f46e5; border-radius: 8px; padding: 18px 20px; margin-bottom: 25px;">
                                        <h3 style="margin: 0 0 6px 0; font-size: 18px; color: #1e1b4b;">
                                            ${stageTitle}
                                        </h3>
                                        <p style="margin: 0; font-size: 14px; color: #3730a3; line-height: 1.5;">
                                            ${stageDescription}
                                        </p>
                                    </div>

                                    ${detailsHtml || ''}

                                    <!-- Vehicle Snapshot Table -->
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 25px;">
                                        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Vehicle Application Details</h4>
                                        <table width="100%" style="font-size: 14px; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Vehicle Name:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #0f172a;">${vehicleName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Registration No:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #0f172a;">${regNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Tracking ID:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #4f46e5;">${trackingId}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 30px 0 10px 0;">
                                        <a href="${actionButtonUrl || 'https://renthub-sponsor.onrender.com/my-bikes'}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); letter-spacing: 0.3px;">
                                            ${actionButtonText || '📍 View Live Onboarding Timeline →'}
                                        </a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 25px 20px; color: #94a3b8; font-size: 12px;">
                                    <div style="color: #ffffff; font-size: 16px; font-weight: 800; margin-bottom: 6px;">RentHub Sponsor Network</div>
                                    <p style="margin: 0 0 6px 0;">Partner Operations & Vehicle Onboarding Control Desk</p>
                                    <p style="margin: 0; color: #64748b; font-size: 11px;">© 2026 RentHub Inc. • 24x7 Sponsor Support: +91 9040757683</p>
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
        subject: `[${trackingId}] ${stageTitle} - ${vehicleName}`,
        html: html
    });
}

// Send Sponsor Application Rejection Notice Email
async function sendSponsorRejectionEmail(sponsorEmail, sponsorName, vehicleData, rejectionReason, stageNumber = 1) {
    if (!sponsorEmail) return { success: false, error: 'No sponsor email provided' };

    const trackingId = vehicleData.tracking_id || `RH-REQ-${vehicleData.id || '1001'}`;
    const vehicleName = vehicleData.name || 'Your Vehicle';
    const regNumber = vehicleData.registration_number || vehicleData.bikeNumber || 'In Verification';
    const stageNames = [
        'Application & Docs Submission',
        'Document & Vehicle Review',
        'Physical Survey Visit',
        'Survey Inspection Scorecard',
        'Price & Revenue Share Terms',
        'Sponsor Agreement Signing',
        'Contract Activation',
        'Anti-Theft GPS Installation',
        'Fleet Live Publishing'
    ];
    const stageName = stageNames[stageNumber - 1] || `Stage ${stageNumber}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vehicle Application Status: Rejected</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 30px 10px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #fee2e2;">
                            <!-- Top Alert Banner -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #dc2626 100%); padding: 35px 30px; text-align: center; color: #ffffff;">
                                    <div style="display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 50px; padding: 6px 16px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px;">
                                        ⚠️ ONBOARDING APPLICATION NOTICE
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff;">Application Not Approved</h1>
                                    <p style="margin: 0; font-size: 15px; color: #fecaca; font-weight: 500;">
                                        Tracking ID: <strong style="color: #ffffff; letter-spacing: 1px;">${trackingId}</strong>
                                    </p>
                                </td>
                            </tr>

                            <!-- Main Body Content -->
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px; margin: 0 0 15px 0;">Hello <strong>${sponsorName || 'Valued Sponsor'}</strong>,</p>
                                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                                        Thank you for submitting your vehicle <strong>${vehicleName}</strong> (${regNumber}) to the RentHub Sponsor Fleet. After review during <strong>${stageName}</strong>, our operations team was unable to approve this application.
                                    </p>

                                    <!-- Rejection Reason Highlight Box -->
                                    <div style="background: #fef2f2; border-left: 5px solid #dc2626; border-radius: 8px; padding: 18px 20px; margin-bottom: 25px;">
                                        <h3 style="margin: 0 0 6px 0; font-size: 15px; text-transform: uppercase; color: #991b1b; font-weight: 800; letter-spacing: 0.5px;">
                                            🛑 Auditor Rejection Reason:
                                        </h3>
                                        <p style="margin: 0; font-size: 15px; color: #7f1d1d; font-weight: 600; line-height: 1.5;">
                                            "${rejectionReason || 'Vehicle does not meet current RentHub compliance or physical inspection safety criteria.'}"
                                        </p>
                                    </div>

                                    <!-- Vehicle Snapshot Table -->
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 25px;">
                                        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Vehicle Application Details</h4>
                                        <table width="100%" style="font-size: 14px; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Vehicle Name:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #0f172a;">${vehicleName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Registration No:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #0f172a;">${regNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Stage Rejected At:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #dc2626;">Stage ${stageNumber}: ${stageName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b;">Tracking ID:</td>
                                                <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #4f46e5;">${trackingId}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Next Steps -->
                                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin-bottom: 25px;">
                                        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #92400e; font-weight: 800;">What are the next steps?</h4>
                                        <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                                            You can resolve the noted issue (such as uploading clear document copies or servicing mechanical parts) and submit a fresh application at any time, or contact our support desk for assistance.
                                        </p>
                                    </div>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 25px 0 10px 0;">
                                        <a href="https://renthub-sponsor.onrender.com/track-application?id=${trackingId}" style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); letter-spacing: 0.3px;">
                                            📍 View Rejection Details in Track Application →
                                        </a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 25px 20px; color: #94a3b8; font-size: 12px;">
                                    <div style="color: #ffffff; font-size: 16px; font-weight: 800; margin-bottom: 6px;">RentHub Sponsor Network</div>
                                    <p style="margin: 0 0 6px 0;">Partner Operations & Vehicle Onboarding Control Desk</p>
                                    <p style="margin: 0; color: #64748b; font-size: 11px;">© 2026 RentHub Inc. • 24x7 Sponsor Support: +91 9040757683</p>
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
        subject: `[${trackingId}] Notice: Vehicle Application Not Approved - ${vehicleName}`,
        html: html
    });
}

module.exports = {
    sendVehicleApprovedEmail,
    sendWithdrawalPaidEmail,
    sendWelcomeEmail,
    sendSponsorTimelineEmail,
    sendSponsorRejectionEmail,
    getStageInfo,
    sendEmail
};

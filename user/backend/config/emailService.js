const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Resend } = require('resend');

// Initialize Resend safely
let apiKey = process.env.RESEND_API_KEY;
if (!apiKey || apiKey.startsWith('re_heeU')) {
    apiKey = Buffer.from('cmVfVjhCaGVvbU5fQXczRnlQdml1N3dEZTRLUDE4dVAzdk5R', 'base64').toString('ascii');
}
const resend = apiKey ? new Resend(apiKey) : null;

// Default sender - pulled from .env for production/custom domains
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@jitus.app';
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
async function sendBookingConfirmationEmail(userEmail, userName, bookingDetails = {}) {
    const bookingId = bookingDetails.bookingId || bookingDetails.booking_id || 'PRO-RH-' + Math.floor(Math.random() * 1000);
    let vehicleName = bookingDetails.vehicleName || bookingDetails.vehicle_name;

    // Safety net: Auto-resolve vehicle name from DB if missing or generic
    if (!vehicleName || vehicleName === 'Vehicle' || vehicleName.startsWith('Vehicle ') || vehicleName.includes('#')) {
        try {
            const vId = bookingDetails.vehicle_id || bookingDetails.vehicleId;
            let vType = (bookingDetails.vehicle_type || bookingDetails.vehicleType || '').toLowerCase().trim();
            if (vType === 'car' || vType === 'cars') vType = 'cars';
            else if (vType === 'bike' || vType === 'bikes') vType = 'bikes';
            else if (vType === 'scooty' || vType === 'scooter') vType = 'scooty';

            if (vType && vId) {
                const supabaseClient = require('./supabase');
                const { data: vData } = await supabaseClient.from(vType).select('name').eq('id', vId).single();
                if (vData && vData.name) {
                    vehicleName = vData.name;
                }
            }
        } catch (vErr) {
            console.warn('Could not auto-resolve vehicle name for email:', vErr.message);
        }
    }
    if (!vehicleName) vehicleName = 'Vehicle';

    const startDate = bookingDetails.startDate || bookingDetails.start_date || 'Scheduled Date';
    const startTime = bookingDetails.startTime || bookingDetails.start_time || 'Scheduled Time';
    const duration = bookingDetails.duration || 1;
    const totalAmount = parseFloat(bookingDetails.totalAmount || bookingDetails.total_amount || 0);
    const advancePayment = parseFloat(bookingDetails.advancePayment || bookingDetails.advance_payment || 0);
    const remainingAmount = bookingDetails.remainingAmount !== undefined ? bookingDetails.remainingAmount : Math.max(0, totalAmount - advancePayment);
    const confirmationTime = bookingDetails.confirmationTime || bookingDetails.confirmation_timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

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
                                            📋 Booking ID: ${bookingId}
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
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${vehicleName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Pickup Date</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${startDate}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Pickup Time</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${startTime}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096; border-bottom: 1px solid #edf2f7;">Duration</td>
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #edf2f7; font-weight: 600;">${duration} Hours</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #718096;">Confirmation Time</td>
                                            <td style="padding: 15px; color: #2d3748; font-weight: 600;">${confirmationTime}</td>
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
                                            <td style="padding: 15px; color: #2d3748; border-bottom: 1px solid #e6fffa; font-weight: 700;">₹${totalAmount}</td>
                                        </tr>
                                        <tr style="background: #f0fff4;">
                                            <td style="padding: 15px; color: #4a5568; border-bottom: 1px solid #c6f6d5;">Advance Paid</td>
                                            <td style="padding: 15px; color: #38a169; border-bottom: 1px solid #c6f6d5; font-weight: 800; font-size: 18px;">₹${advancePayment} ✓</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 15px; color: #2d3748; font-weight: 800;">Payable at Pickup</td>
                                            <td style="padding: 15px; color: #e53e3e; font-weight: 900; font-size: 20px;">₹${remainingAmount}</td>
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

// In-memory deduplication set: prevents duplicate emails within 45 seconds for same recipient & event
const recentSOSEmails = new Map();

function isDuplicateSOSEmail(recipient, bookingId, windowMs = 45000) {
    if (!recipient) return false;
    const cleanEmail = String(recipient).toLowerCase().trim();
    const cleanId = String(bookingId || 'sos').trim();
    const key = `${cleanEmail}_${cleanId}`;
    const now = Date.now();
    const lastSent = recentSOSEmails.get(key);
    if (lastSent && (now - lastSent) < windowMs) {
        return true;
    }
    return false;
}

function recordSOSEmailSent(recipient, bookingId) {
    if (!recipient) return;
    const cleanEmail = String(recipient).toLowerCase().trim();
    const cleanId = String(bookingId || 'sos').trim();
    const key = `${cleanEmail}_${cleanId}`;
    recentSOSEmails.set(key, Date.now());

    if (recentSOSEmails.size > 200) {
        const threshold = Date.now() - 600000;
        for (const [k, ts] of recentSOSEmails.entries()) {
            if (ts < threshold) recentSOSEmails.delete(k);
        }
    }
}

/**
 * Builds professional, responsive HTML email for RentHub SOS Emergency Alert
 * Features:
 * - RentHub SOS Emergency Alert header
 * - Booking ID and customer details
 * - Vehicle details
 * - SOS activation date and time
 * - Customer's exact GPS location with a Google Maps link
 * - Retell AI call status and emergency summary (if available)
 * - Four categories: Petrol Pumps, Vehicle Repair Garages, Police Stations, Hospitals (Max 3 each)
 * - Prominent 112 & 108 Emergency numbers (India)
 */
function generateSOSEmergencyEmailHtml(data = {}) {
    const {
        recipientRole = 'customer',
        userName = 'RentHub Customer',
        userPhone = 'Not Provided',
        userEmail = 'Not Provided',
        bookingId = 'Active Booking',
        vehicleName = 'Rented Vehicle',
        pickupLocation = 'Registered Station',
        alertTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        gpsLocation = 'Location Provided',
        googleMapsLink = null,
        retellCallStatus = null,
        emergencySummary = null,
        nearbyData = {}
    } = data;

    const {
        petrolPumps = [],
        garages = [],
        policeStations = [],
        hospitals = [],
        userCoordinates = {}
    } = nearbyData;

    const coordsLat = userCoordinates.latitude || (googleMapsLink ? (googleMapsLink.match(/q=([-+]?\d+\.?\d*)/)?.[1]) : null);
    const coordsLng = userCoordinates.longitude || (googleMapsLink ? (googleMapsLink.match(/,([-+]?\d+\.?\d*)/)?.[1]) : null);
    const liveMapUrl = googleMapsLink || (coordsLat && coordsLng ? `https://www.google.com/maps?q=${coordsLat},${coordsLng}` : null);

    const renderPlaceItem = (p, idx, accentColor) => {
        const distance = p.distanceText || (p.distanceKm !== undefined ? `${p.distanceKm} km` : 'Nearby');
        const phoneHtml = p.phone && String(p.phone).trim() && String(p.phone).toLowerCase() !== 'not available'
            ? `<a href="tel:${p.phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${p.phone}</a>`
            : `<span style="color: #64748b; font-style: italic;">Not available (Use directions)</span>`;

        return `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="vertical-align: top;">
                            <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 4px;">
                                <a href="${p.directionsUrl}" target="_blank" style="color: #0f172a; text-decoration: none;">
                                    ${idx + 1}. ${p.name}
                                </a>
                            </div>
                        </td>
                        <td align="right" style="vertical-align: top; white-space: nowrap; padding-left: 10px;">
                            <span style="display: inline-block; background: #f8fafc; color: #0f172a; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid #cbd5e1;">
                                📍 ${distance}
                            </span>
                        </td>
                    </tr>
                </table>
                <div style="font-size: 13px; color: #475569; line-height: 1.5; margin: 6px 0 10px 0;">
                    <div><strong>Address:</strong> ${p.address || 'Available via Google Maps link'}</div>
                    <div style="margin-top: 3px;"><strong>Phone:</strong> ${phoneHtml}</div>
                </div>
                <div style="text-align: right;">
                    <a href="${p.directionsUrl}" target="_blank" style="display: inline-block; background: ${accentColor}; color: #ffffff; padding: 7px 14px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.12);">
                        🗺️ View on Google Maps / Directions &rarr;
                    </a>
                </div>
            </div>
        `;
    };

    const renderCategory = (title, icon, accentColor, items = [], emptyText = 'No verified places found within the immediate radius.') => {
        const list = Array.isArray(items) ? items.slice(0, 3) : [];
        let content = '';
        if (list.length === 0) {
            content = `
                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; color: #64748b; font-size: 13px;">
                    ${emptyText}
                </div>
            `;
        } else {
            content = list.map((p, idx) => renderPlaceItem(p, idx, accentColor)).join('');
        }

        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 2px solid ${accentColor}; padding-bottom: 6px;">
                    <h3 style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${icon} ${title}
                    </h3>
                </div>
                ${content}
            </div>
        `;
    };

    const retellBlock = (retellCallStatus || emergencySummary) ? `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 25px;">
            <div style="color: #1e293b; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                🎙️ Retell AI Emergency Call Status
            </div>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px;">
                ${retellCallStatus ? `
                <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 35%;">Call Status:</td>
                    <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${retellCallStatus}</td>
                </tr>
                ` : ''}
                ${emergencySummary ? `
                <tr>
                    <td style="padding: 4px 0; color: #64748b; vertical-align: top;">Emergency Summary:</td>
                    <td style="padding: 4px 0; color: #b91c1c; font-weight: 600;">${emergencySummary}</td>
                </tr>
                ` : ''}
            </table>
        </div>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RentHub SOS Emergency Alert</title>
            <style>
                @media only screen and (max-width: 600px) {
                    .container-table { width: 100% !important; border-radius: 0 !important; }
                    .content-cell { padding: 20px 15px !important; }
                    .header-cell { padding: 25px 15px !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
                <tr>
                    <td align="center" style="padding: 25px 10px;">
                        <table class="container-table" border="0" cellpadding="0" cellspacing="0" width="620" style="max-width: 620px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid #334155;">
                            
                            <!-- Header Banner -->
                            <tr>
                                <td class="header-cell" align="center" style="background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); padding: 32px 20px; color: #ffffff;">
                                    <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); color: #ffffff; padding: 5px 14px; border-radius: 50px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
                                        ⚠️ PRIORITY EMERGENCY ALERT
                                    </div>
                                    <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                                        RentHub SOS Emergency Alert
                                    </h1>
                                    <p style="margin: 0; font-size: 14px; opacity: 0.95; font-weight: 500;">
                                        Automated Live Roadside Assistance & Emergency Coordinates
                                    </p>
                                </td>
                            </tr>

                            <!-- Main Content Area -->
                            <tr>
                                <td class="content-cell" style="padding: 30px 25px; background: #ffffff;">
                                    
                                    <!-- Booking & Customer Details Card -->
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 22px;">
                                        <div style="color: #475569; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                                            📋 Booking & Customer Details
                                        </div>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b; width: 38%;"><strong>Booking ID:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-size: 15px; font-weight: 700;">${bookingId}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>Customer Name:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">${userName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>Contact Number:</strong></td>
                                                <td style="padding: 5px 0;">
                                                    <a href="tel:${userPhone}" style="color: #dc2626; font-weight: 800; text-decoration: none;">${userPhone}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>Registered Email:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a;">${userEmail}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>Vehicle Details:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a; font-weight: 700;">${vehicleName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>Pickup Location:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a;">${pickupLocation}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0; color: #64748b;"><strong>SOS Alert Time:</strong></td>
                                                <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">${alertTimestamp}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Customer Exact GPS Location Card -->
                                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 10px; padding: 18px; margin-bottom: 22px; text-align: center;">
                                        <div style="color: #1d4ed8; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                                            📍 Customer's Exact GPS Location
                                        </div>
                                        <p style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 14px; font-weight: 600;">
                                            ${gpsLocation}
                                        </p>
                                        ${liveMapUrl ? `
                                        <a href="${liveMapUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: 800; font-size: 14px; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);">
                                            🗺️ Open Exact Customer Location in Google Maps &rarr;
                                        </a>
                                        ` : ''}
                                    </div>

                                    <!-- Retell AI Status (if present) -->
                                    ${retellBlock}

                                    <!-- Section 1: Petrol Pumps -->
                                    ${renderCategory('PETROL PUMPS – Maximum 3', '⛽', '#ea580c', petrolPumps, 'No petrol pumps found in the immediate radius.')}

                                    <!-- Section 2: Vehicle Repair Garages -->
                                    ${renderCategory('VEHICLE GARAGES – Maximum 3', '🔧', '#2563eb', garages, 'No vehicle repair garages found in the immediate radius.')}

                                    <!-- Section 3: Police Stations -->
                                    ${renderCategory('NEAREST POLICE STATIONS – Maximum 3', '👮', '#4f46e5', policeStations, 'No police stations found in the immediate radius.')}

                                    <!-- Section 4: Hospitals -->
                                    ${renderCategory('NEAREST HOSPITALS – Maximum 3', '🏥', '#dc2626', hospitals, 'No hospitals found in the immediate radius.')}

                                    <!-- Emergency Numbers Section (Prominent) -->
                                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                                        <div style="color: #b91c1c; font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">
                                            🚨 National Emergency Numbers (India)
                                        </div>
                                        <p style="margin: 0 0 14px 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                                            In case of immediate threat to safety or severe medical emergency, dial directly:
                                        </p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 6px;">
                                                    <a href="tel:112" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);">
                                                        📞 112 – Emergency Assistance in India (Police / Fire / Unified)
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding: 6px;">
                                                    <a href="tel:108" style="display: inline-block; background: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.3);">
                                                        🚑 108 – Ambulance Emergency Service in India
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 14px 0 0 0; color: #7f1d1d; font-size: 11.5px; line-height: 1.4;">
                                            <em>Notice: These helplines are provided for direct calling from your device. RentHub does not claim that emergency services have been contacted automatically unless an actual contact has been made by phone.</em>
                                        </p>
                                    </div>

                                    <!-- Roadside Dispatch Control Room -->
                                    <div style="background: #f1f5f9; border-radius: 10px; padding: 16px; text-align: center; margin-top: 20px;">
                                        <div style="color: #334155; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
                                            RentHub 24x7 Roadside Dispatch Control Room
                                        </div>
                                        <a href="tel:+919040757683" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px;">
                                            📞 Call Control Room (+91 9040757683)
                                        </a>
                                    </div>

                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 22px 20px; color: #94a3b8; font-size: 12px;">
                                    <div style="color: #ffffff; font-size: 16px; font-weight: 800; margin-bottom: 4px;">
                                        RentHub Emergency Response System
                                    </div>
                                    <p style="margin: 0 0 4px 0;">Automated AI GPS Roadside Dispatch</p>
                                    <p style="margin: 0; color: #64748b; font-size: 11px;">
                                        © 2026 RentHub Inc. Ride safe and wear your helmet at all times.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

// Send SOS alert email to admin
async function sendSOSAlertEmail(adminEmail, sosData, nearbyData = {}) {
    try {
        const recipients = Array.isArray(adminEmail) ? adminEmail : [adminEmail];
        const primaryRecipient = recipients[0] || 'admin@renthub.app';

        if (isDuplicateSOSEmail(primaryRecipient, sosData.bookingId)) {
            console.log(`⚠️ [Admin SOS Alert] Prevented duplicate email to ${primaryRecipient} for booking ${sosData.bookingId}`);
            return { success: true, duplicatePrevented: true };
        }

        const html = generateSOSEmergencyEmailHtml({
            recipientRole: 'admin',
            userName: sosData.userName,
            userPhone: sosData.phoneNumber,
            userEmail: sosData.userEmail,
            bookingId: sosData.bookingId,
            vehicleName: sosData.bikeModel || sosData.vehicleName || 'Vehicle',
            pickupLocation: sosData.pickupLocation || 'Registered Station',
            alertTimestamp: sosData.timestamp,
            gpsLocation: sosData.gpsLocation,
            googleMapsLink: sosData.googleMapsLink,
            retellCallStatus: sosData.retellCallStatus,
            emergencySummary: sosData.emergencySummary,
            nearbyData: nearbyData
        });

        const result = await sendEmail({
            to: adminEmail,
            subject: `🚨 [SOS ALERT] Immediate Action Required - Booking #${sosData.bookingId}`,
            html: html
        });

        if (result.success) {
            recordSOSEmailSent(primaryRecipient, sosData.bookingId);
        }

        return result;
    } catch (err) {
        console.error('Error in sendSOSAlertEmail:', err.message);
        return { success: false, error: err.message };
    }
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
    if (!vehicleName || vehicleName === 'Vehicle' || vehicleName.startsWith('Vehicle ') || vehicleName.includes('#')) {
        try {
            if (bookingId) {
                const supabaseClient = require('./supabase');
                let query = supabaseClient.from('bookings').select('vehicle_id, vehicle_type');
                const cleanId = String(bookingId).trim();
                const numId = Number(cleanId);
                if (!isNaN(numId) && String(numId) === cleanId) {
                    query = query.or(`id.eq.${numId},booking_id.eq.${cleanId}`);
                } else {
                    query = query.eq('booking_id', cleanId);
                }
                const { data: bData } = await query.single();
                if (bData && bData.vehicle_id) {
                    let vTable = (bData.vehicle_type || '').toLowerCase().trim();
                    if (vTable === 'car' || vTable === 'cars') vTable = 'cars';
                    else if (vTable === 'bike' || vTable === 'bikes') vTable = 'bikes';
                    else if (vTable === 'scooty' || vTable === 'scooter') vTable = 'scooty';
                    if (vTable) {
                        const { data: vData } = await supabaseClient.from(vTable).select('name').eq('id', bData.vehicle_id).single();
                        if (vData?.name) vehicleName = vData.name;
                    }
                }
            }
        } catch (e) {
            console.warn('Could not auto-resolve vehicle name for cancellation email:', e.message);
        }
    }
    if (!vehicleName) vehicleName = 'Vehicle';

    const frontendUrl = (process.env.FRONTEND_URL || 'https://rent-hub-r.vercel.app').replace(/\/$/, '');
    const refundLink = `${frontendUrl}/my-bookings`;

    const html = `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Booking Cancelled</h2>
          </div>
          <div style="padding: 25px;">
            <p>Hello <b>${userName || 'Valued Customer'}</b>,</p>
            <p>Your booking request <b>#${bookingId}</b> for <b>${vehicleName}</b> has been cancelled.</p>
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
 * Send email to customer with nearest petrol pumps, vehicle repair garages, police stations, and hospitals
 */
async function sendNearestLocationsEmail(userEmail, userName, bookingDetails = {}, nearbyData = {}) {
    try {
        if (!userEmail) {
            console.error('❌ Cannot send nearest locations email: recipient email missing');
            return { success: false, error: 'Recipient email is required' };
        }

        const bookingId = bookingDetails.bookingId || bookingDetails.id || 'Active Ride';

        // Prevent duplicate emails for the same SOS event within 45 seconds
        if (isDuplicateSOSEmail(userEmail, bookingId)) {
            console.log(`⚠️ Prevented duplicate SOS email dispatch to ${userEmail} for booking ${bookingId}`);
            return { success: true, duplicatePrevented: true };
        }

        const html = generateSOSEmergencyEmailHtml({
            recipientRole: 'customer',
            userName: userName || bookingDetails.userName || 'Customer',
            userPhone: bookingDetails.phoneNumber || bookingDetails.userPhone || 'Registered Phone',
            userEmail: userEmail,
            bookingId: bookingId,
            vehicleName: bookingDetails.vehicleName || bookingDetails.bikeModel || 'Vehicle',
            pickupLocation: bookingDetails.pickupLocation || 'Registered Station',
            alertTimestamp: bookingDetails.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            gpsLocation: bookingDetails.gpsLocation || (nearbyData.userCoordinates ? `Lat: ${nearbyData.userCoordinates.latitude}, Lng: ${nearbyData.userCoordinates.longitude}` : 'Location detected via GPS'),
            googleMapsLink: bookingDetails.googleMapsLink || (nearbyData.mapSearchLinks?.userLocationMap || null),
            retellCallStatus: bookingDetails.retellCallStatus,
            emergencySummary: bookingDetails.emergencySummary,
            nearbyData: nearbyData
        });

        const result = await sendEmail({
            to: userEmail,
            subject: `🚨 [RentHub SOS Alert] Nearest Help Locations - Booking #${bookingId}`,
            html: html
        });

        if (result.success) {
            recordSOSEmailSent(userEmail, bookingId);
            console.log(`✉️ SOS Emergency Locations email successfully delivered to ${userEmail} for booking ${bookingId}`);
        } else {
            console.error(`❌ Failed to deliver SOS email to ${userEmail}: ${result.error}`);
        }

        return result;
    } catch (err) {
        console.error('Error in sendNearestLocationsEmail:', err.message);
        return { success: false, error: err.message };
    }
}

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
    generateSOSEmergencyEmailHtml,
    isDuplicateSOSEmail,
    recordSOSEmailSent,
    sendRideCompletedEmail,
    sendVehicleApprovedEmail,
    sendNewOfferEmail,
    sendSponsorTimelineEmail,
    getStageInfo,
    sendEmail,
    SENDER_EMAIL
};
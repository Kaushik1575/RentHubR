const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { sendEmail } = require('../config/emailService');
const supabase = require('../config/supabase');

// Helper: create invoices folder
const INVOICE_DIR = path.join(__dirname, '..', '..', 'frontend', 'invoices');
fs.mkdirSync(INVOICE_DIR, { recursive: true });

// POST /api/confirmBooking
// Expected body: { bookingId, userName, userEmail, vehicleName, duration, startDateTime, totalAmount, advancePayment, remainingAmount, terms }
router.post('/confirmBooking', async (req, res) => {
    try {
        const body = req.body || {};
        const bookingId = body.bookingId || `BK-${Date.now()}`;
        const userName = body.userName || 'Customer';
        const userEmail = body.userEmail;
        const vehicleName = body.vehicleName || 'Vehicle';
        // Format vehicle type for display (e.g. 'cars' -> 'Car')
        const rawType = body.vehicleType || 'Standard';
        const formatType = (t) => {
            if (!t) return 'Standard';
            const lower = t.toLowerCase();
            if (lower.includes('car')) return 'Car';
            if (lower.includes('bike')) return 'Bike';
            if (lower.includes('scooty') || lower.includes('scooter')) return 'Scooty';
            return t.charAt(0).toUpperCase() + t.slice(1);
        };
        const vehicleType = formatType(rawType);
        const duration = parseFloat(body.duration) || 1;
        const startDateTime = body.startDateTime || dayjs().add(1, 'day').format();
        const totalAmount = parseFloat(body.totalAmount) || 0;
        const advancePayment = parseFloat(body.advancePayment) || 0;
        const remainingAmount = parseFloat(body.remainingAmount) || (totalAmount - advancePayment);
        const terms = body.terms || 'Standard RentHub terms apply.';

        if (!userEmail) return res.status(400).json({ error: 'userEmail required' });

        // Build QR payload
        const qrPayload = {
            bookingId,
            userName,
            vehicleName,
            vehicleType, // Added to QR payload
            pickupDateTime: startDateTime,
            totalAmount
        };

        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

        // Generate PDF
        const pdfPath = path.join(INVOICE_DIR, `booking_invoice_${bookingId}.pdf`);
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Header (text logo)
        doc.fontSize(20).fillColor('#0b5cff').text('RentHub', { continued: true });
        doc.fontSize(10).fillColor('#444').text(' — Booking Invoice', { align: 'right' });
        doc.moveDown();

        doc.fontSize(12).fillColor('#000').text(`Hello ${userName},`, { underline: false });
        doc.moveDown(0.2);

        doc.fontSize(12).text(`Booking ID: ${bookingId}`);
        doc.text(`Vehicle: ${vehicleName}`);
        doc.text(`Type: ${vehicleType}`); // Added to PDF
        doc.text(`Start: ${startDateTime}`);
        doc.text(`Duration: ${duration} hours`);
        doc.moveDown();

        // Amount breakdown table-like
        doc.fontSize(11).text('Amount Breakdown', { underline: true });
        doc.moveDown(0.2);
        doc.fontSize(10).text(`Total Amount: ₹${totalAmount}`);
        doc.text(`Advance Paid: ₹${advancePayment}`);
        doc.text(`Remaining Amount: ₹${remainingAmount}`);
        doc.moveDown();

        // Add QR code image to the right
        const qrBase64 = qrDataUrl.split(',')[1];
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        const qrImageSize = 120;
        const qrX = doc.page.width - doc.page.margins.right - qrImageSize;
        const currentY = doc.y - qrImageSize - 10;
        // If there's space, place QR next to the amounts
        try {
            doc.image(qrBuffer, qrX, doc.y - 20, { width: qrImageSize });
        } catch (err) {
            // ignore image errors
        }

        doc.moveDown(2);

        doc.fontSize(10).text('Terms & Conditions', { underline: true });
        doc.fontSize(9).fillColor('#444').text(terms, { width: 450 });

        doc.moveDown(2);
        doc.fontSize(9).fillColor('#888').text('Thank you for choosing RentHub.', { align: 'center' });

        doc.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Send email with attachment
        // Build Google Calendar link
        const start = dayjs(startDateTime);
        const end = start.add(duration, 'hour');
        const formatForCal = (d) => {
            // Use ISO and strip characters to match Google Calendar format YYYYMMDDTHHMMSSZ
            const iso = (new Date(d)).toISOString();
            return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        const gcalDates = `${formatForCal(start)}/${formatForCal(end)}`;
        const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
        const gcalText = encodeURIComponent(`RentHub booking ${bookingId} — ${vehicleName}`);
        const gcalDetails = encodeURIComponent(`Booking ID: ${bookingId}\nVehicle: ${vehicleName}\nPickup: ${startDateTime}`);
        const gcalUrl = `${gcalBase}&text=${gcalText}&dates=${gcalDates}&details=${gcalDetails}`;

        // Read pdf buffer
        const pdfBuffer = fs.readFileSync(pdfPath);

        const mailHtml = `
            <div style="font-family: Arial, sans-serif; color: #222;">
              <h2 style="color:#0b5cff;">Hello ${userName},</h2>
              <p>Your booking is confirmed. Please find the invoice attached.</p>
              <h3>Booking details</h3>
              <table style="width:100%; border-collapse: collapse;">
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Booking ID</b></td><td style="padding:6px; border:1px solid #eee;">${bookingId}</td></tr>
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #eee;">${vehicleName}</td></tr>
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Type</b></td><td style="padding:6px; border:1px solid #eee;">${vehicleType}</td></tr>
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Pickup</b></td><td style="padding:6px; border:1px solid #eee;">${startDateTime}</td></tr>
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Duration</b></td><td style="padding:6px; border:1px solid #eee;">${duration} hours</td></tr>
                <tr><td style="padding:6px; border:1px solid #eee;"><b>Total</b></td><td style="padding:6px; border:1px solid #eee;">₹${totalAmount}</td></tr>
              </table>
              <p style="margin-top:12px;">
                <a href="${gcalUrl}" style="display:inline-block;padding:10px 14px;background:#0b5cff;color:#fff;border-radius:4px;text-decoration:none;">Add to Google Calendar</a>
                &nbsp;
                <a href="/invoices/booking_invoice_${bookingId}.pdf" style="display:inline-block;padding:10px 14px;border:1px solid #0b5cff;color:#0b5cff;border-radius:4px;text-decoration:none;">Download Invoice</a>
              </p>
              <hr style="margin-top:18px;" />
              <p style="font-size:12px;color:#666;">Pickup instructions: Please bring a valid ID and a printed or digital copy of this invoice. If you have any questions call us.</p>
              <p style="font-size:12px;color:#666;">If you find this email in spam, please mark as <b>Not Spam</b> to ensure future delivery.</p>
              <footer style="margin-top:18px;padding-top:8px;border-top:1px solid #eee;color:#999;font-size:12px;">
                <div>RentHub — Bike & Vehicle Rentals</div>
                <div>support@renthub.example | +91 90000 00000</div>
                <div>123 RentHub Street, City, Country</div>
              </footer>
            </div>
        `;

        const mailOptions = {
            to: userEmail,
            subject: 'Booking Confirmed – RentHub',
            html: mailHtml,
            attachments: [
                { filename: 'booking_invoice.pdf', content: pdfBuffer }
            ]
        };

        await sendEmail(mailOptions);

        // Optionally store a copy or update Supabase booking record (if booking id exists)
        try {
            if (body.bookingId && body.bookingId.startsWith('BK-') === false) {
                // attempt to find booking by id in numeric or string form
                const { data, error } = await supabase.from('bookings').select('*').eq('id', body.bookingId).single();
                if (!error && data) {
                    await supabase.from('bookings').update({ status: 'confirmed', confirmation_timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss') }).eq('id', body.bookingId);
                }
            }
        } catch (e) {
            // ignore supabase update errors
            console.warn('Supabase update skipped:', e.message);
        }

        res.json({ success: true, message: 'Invoice generated and email sent', invoicePath: `/invoices/booking_invoice_${bookingId}.pdf` });
    } catch (err) {
        console.error('Error in /confirmBooking:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/trackBooking?id=xxxxx
router.get('/trackBooking', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).json({ error: 'id required' });
        // Try to fetch booking from supabase
        try {
            const { data, error } = await supabase.from('bookings').select('id, status, start_date, start_time, duration, vehicle_id, vehicle_type, advance_payment, created_at').eq('id', id).single();
            if (error || !data) {
                return res.json({ id, status: 'unknown', message: 'Booking not found in DB (demo response)' });
            }
            return res.json({ success: true, booking: data });
        } catch (e) {
            return res.json({ id, status: 'unknown', message: 'Unable to fetch booking' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

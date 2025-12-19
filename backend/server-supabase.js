// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SupabaseDB = require('./models/supabaseDB');
const supabase = require('./config/supabase');
const { sendBookingConfirmationEmail, sendPasswordResetOTP, sendRegistrationOTP, generateOTP, sendSOSLinkEmail, sendSOSAlertEmail } = require('./config/emailService');
const { makeBookingConfirmationCall } = require('./config/retellCallService');
const { checkAndSendReminders, sendImmediateReminderIfNeeded } = require('./services/reminderService');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = 'your-secret-key'; // Use the same secret key as server-new.js
const ADMIN_EMAILS = ['jyoti2006@gmail.com']; // <-- Replace with your actual admin email

// Simple in-memory cache
const cache = {
    dashboardStats: null,
    dashboardStatsTimestamp: 0,
    ttl: 60000 // 60 seconds
};

// Password validation helper (server-side enforcement)
const weakPasswords = new Set([
    '123456', 'password', 'admin', '12345678', 'qwerty', 'letmein', 'welcome', 'password1', '12345', 'passw0rd'
]);

function validatePassword(password) {
    const errors = [];
    if (typeof password !== 'string') {
        errors.push('Password must be a string');
        return { valid: false, errors };
    }

    if (password.includes(' ')) {
        errors.push('Password cannot contain spaces');
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit (0-9)');
    }

    // allowed special characters: ! @ # $ % ^ & * _ - ?
    if (!/[!@#\$%\^&\*_\-\?]/.test(password)) {
        errors.push('Password must include at least one special character (! @ # $ % ^ & * _ - ?)');
    }

    if (weakPasswords.has(password.toLowerCase())) {
        errors.push('This password is too common or weak — please choose a stronger password');
    }

    return { valid: errors.length === 0, errors };
}

// Middleware
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Booking confirmation + invoice routes (PDF, QR, Email)
try {
    const bookingConfirmationRoutes = require('./services/bookingConfirmation');
    app.use('/api', bookingConfirmationRoutes);
} catch (err) {
    console.warn('Booking confirmation routes not loaded:', err.message);
}

// Helper function: Generate PDF invoice and return as buffer
const generateInvoiceBuffer = async (bookingId, userName, userEmail, vehicleName, duration, startDateTime, totalAmount, advancePayment, terms = 'Standard RentHub terms apply.') => {
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    const fs = require('fs');
    const path = require('path');

    try {
        // Generate QR payload
        const qrPayload = { bookingId, userName, vehicleName, pickupDateTime: startDateTime, totalAmount };
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
        const qrBase64 = qrDataUrl.split(',')[1];
        const qrBuffer = Buffer.from(qrBase64, 'base64');

        // Create PDF in memory
        const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Invoice ${bookingId}`, Author: 'RentHub' } });
        let buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));

        // Try to find a logo file (prefer png/jpg)
        const photoDir = path.join(__dirname, '../frontend', 'photo');
        const logoCandidates = ['logo.png', 'logo.jpg', 'logo.jpeg', 'KD.jpg', 'JSP.jpg'];
        let logoPath = null;
        for (const name of logoCandidates) {
            const p = path.join(photoDir, name);
            if (fs.existsSync(p)) { logoPath = p; break; }
        }

        const margin = 40;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - (2 * margin);

        // ===== HEADER =====
        doc.fillColor('#1e3a5f').rect(0, 0, pageWidth, 70).fill();

        // Logo or placeholder
        if (logoPath) {
            try {
                doc.image(logoPath, margin, 8, { width: 50, height: 50 });
            } catch (err) {
                doc.fillColor('#00d084').rect(margin, 8, 50, 50).fill();
            }
        } else {
            doc.fillColor('#00d084').rect(margin, 8, 50, 50).fill();
        }

        // Header text
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('RentHub', margin + 60, 12);
        doc.fillColor('#00d084').fontSize(12).font('Helvetica').text('BOOKING INVOICE', margin + 60, 42);

        doc.y = 80;

        // ===== CUSTOMER & INVOICE DETAILS =====
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('CUSTOMER & BOOKING DETAILS', margin);
        doc.moveDown(0.3);

        // Gray background box for details
        const detailsY = doc.y;
        doc.fillColor('#f3f4f6').rect(margin, detailsY, contentWidth, 70).fill();
        doc.strokeColor('#e5e7eb').lineWidth(1).rect(margin, detailsY, contentWidth, 70).stroke();

        // Left column
        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Customer Name:', margin + 12, detailsY + 8);
        doc.fillColor('#000').fontSize(10).font('Helvetica').text(userName || 'N/A', margin + 12);

        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Email:', margin + 12);
        doc.fillColor('#000').fontSize(9).font('Helvetica').text(userEmail || 'N/A', margin + 12);

        // Right column
        const rightColX = margin + (contentWidth / 2);
        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Booking ID:', rightColX, detailsY + 8);
        doc.fillColor('#000').fontSize(10).font('Helvetica').text(bookingId || 'N/A', rightColX);

        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Vehicle:', rightColX);
        doc.fillColor('#000').fontSize(9).font('Helvetica').text(vehicleName || 'N/A', rightColX);

        doc.y = detailsY + 75;

        // ===== BOOKING DETAILS =====
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('RENTAL DETAILS', margin);
        doc.moveDown(0.3);

        const bookingDetailsY = doc.y;
        doc.fillColor('#f3f4f6').rect(margin, bookingDetailsY, contentWidth, 50).fill();
        doc.strokeColor('#e5e7eb').lineWidth(1).rect(margin, bookingDetailsY, contentWidth, 50).stroke();

        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Start Date & Time:', margin + 12, bookingDetailsY + 8);
        doc.fillColor('#000').fontSize(9).font('Helvetica').text(startDateTime || 'N/A', margin + 12);

        doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('Duration:', rightColX, bookingDetailsY + 8);
        doc.fillColor('#000').fontSize(9).font('Helvetica').text(`${duration} hours`, rightColX);

        doc.y = bookingDetailsY + 55;

        // ===== AMOUNT BREAKDOWN =====
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica-Bold').text('AMOUNT BREAKDOWN', margin);
        doc.moveDown(0.2);

        const amountY = doc.y;
        doc.fillColor('#f3f4f6').rect(margin, amountY, contentWidth - 80, 75).fill();
        doc.strokeColor('#e5e7eb').lineWidth(1).rect(margin, amountY, contentWidth - 80, 75).stroke();

        const labelX = margin + 12;
        const valueX = margin + contentWidth - 120;
        let lineY = amountY + 10;

        // Total
        doc.fillColor('#374151').fontSize(10).font('Helvetica').text('Total Amount:', labelX, lineY);
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold').text(`₹${totalAmount.toFixed(2)}`, valueX, lineY);

        lineY += 18;

        // Advance
        doc.fillColor('#374151').fontSize(10).font('Helvetica').text('Advance Paid:', labelX, lineY);
        doc.fillColor('#00a86b').fontSize(10).font('Helvetica-Bold').text(`₹${(advancePayment || 0).toFixed(2)}`, valueX, lineY);

        lineY += 18;

        // Remaining
        const remaining = (totalAmount || 0) - (advancePayment || 0);
        doc.fillColor('#374151').fontSize(10).font('Helvetica').text('Remaining:', labelX, lineY);
        doc.fillColor('#ff6b35').fontSize(10).font('Helvetica-Bold').text(`₹${remaining.toFixed(2)}`, valueX, lineY);

        // QR Code - Right side of amount box
        try {
            const qrSize = 75;
            const qrX = margin + contentWidth - 75;
            const qrY = amountY + 5;
            doc.image(qrBuffer, qrX, qrY, { width: qrSize });
        } catch (err) {
            console.warn('QR image error:', err.message);
        }

        doc.y = amountY + 80;

        // ===== TERMS & CONDITIONS (Compact) =====
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold').text('TERMS & CONDITIONS', margin);
        doc.moveDown(0.15);

        const termsSections = [
            {
                title: '1. Booking Confirmation', color: '#3b82f6', bgColor: '#eff6ff', titleColor: '#1e40af', items: [
                    'Advance booking confirmed after payment. Confirmation email will be sent.'
                ]
            },
            {
                title: '2. Advance Payment', color: '#10b981', bgColor: '#ecfdf5', titleColor: '#047857', items: [
                    'Minimum ₹100/- advance required. Remaining paid at pickup.'
                ]
            },
            {
                title: '3. Cancellation Policy', color: '#f59e0b', bgColor: '#fffbeb', titleColor: '#92400e', items: [
                    '2+ hrs before: Full refund. Within 2 hrs: 50% deducted.'
                ]
            },
            {
                title: '4. Required Documents', color: '#06b6d4', bgColor: '#ecfdf5', titleColor: '#0e7490', items: [
                    'Valid Aadhar Card required at pickup. Booking cancelled without valid documents.'
                ]
            },
            {
                title: '5. Bike Usage', color: '#ef4444', bgColor: '#fef2f2', titleColor: '#b91c1c', items: [
                    'Only registered renter can use. Sub-renting strictly prohibited.'
                ]
            },
            {
                title: '6. Late Return', color: '#f97316', bgColor: '#fff7ed', titleColor: '#c2410c', items: [
                    'Late return charges apply per hour beyond scheduled time.'
                ]
            },
            {
                title: '7. Refund Policy', color: '#10b981', bgColor: '#ecfdf5', titleColor: '#047857', items: [
                    'Refunds processed within 3-5 working days after cancellation.'
                ]
            },
            {
                title: '8. Company Rights', color: '#6b7280', bgColor: '#f9fafb', titleColor: '#374151', items: [
                    'Company may cancel due to unforeseen issues. Full refund provided.'
                ]
            }
        ];

        let termsY = doc.y;
        for (const section of termsSections) {
            const sectionHeight = 24 + (section.items.length * 8);

            // Background
            doc.fillColor(section.bgColor).rect(margin, termsY, contentWidth, sectionHeight).fill();
            doc.strokeColor(section.color).lineWidth(1).rect(margin, termsY, contentWidth, sectionHeight).stroke();

            // Title
            doc.fillColor(section.titleColor).fontSize(7).font('Helvetica-Bold').text(section.title, margin + 6, termsY + 4);

            // Items
            let itemY = termsY + 15;
            doc.fillColor('#374151').fontSize(6).font('Helvetica');
            for (const item of section.items) {
                doc.text('• ' + item, margin + 10, itemY, { width: contentWidth - 18 });
                itemY += 7;
            }

            termsY = itemY + 3;
        }

        doc.y = termsY;

        // ===== FOOTER =====
        const footerY = pageHeight - 40;
        doc.fillColor('#f3f4f6').rect(0, footerY, pageWidth, 40).fill();
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text('RentHub — Premium Bike & Scooty Rentals | support@renthub.in | +91 98765 43210 | www.renthub.in', margin, footerY + 5, { width: contentWidth });
        doc.fillColor('#9ca3af').fontSize(7).text('© 2024 RentHub. All rights reserved.', margin, footerY + 22);

        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
        });
    } catch (err) {
        console.error('Error generating invoice buffer:', err);
        throw err;
    }
};

// Serve Static Files (Frontend)
const frontendPath = path.join(__dirname, '../frontend/dist');
const indexPath = path.join(frontendPath, 'index.html');

// Check if frontend build exists
const fs = require('fs');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}

// Root route - serve index.html or API status
app.get('/', (req, res) => {
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('RentHub API is running. (Frontend not found - this is normal if using Vercel for frontend)');
    }
});

// Serve SOS activation page - Handle via React Router (SPA)
app.get('/sos-activate', (req, res) => {
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('SOS Activation API is active. Please use the Frontend App.');
    }
});

// Middleware to verify user token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('VerifyToken: No auth header');
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('VerifyToken: No token in auth header');
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('VerifyToken: Invalid token', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};



// Admin middleware
const verifyAdminToken = async (req, res, next) => {
    console.log('verifyAdminToken called');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);
        const { data: user, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', decoded.id)
            .single();
        console.log('User from DB:', user, 'Error:', error);
        if (error || !user || !user.is_admin) {
            console.log('Not authorized as admin');
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Invalid token:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Helper function to get IST time in 'YYYY-MM-DD HH:mm:ss' format
function getISTTimestamp() {
    const now = new Date();
    // Convert to IST (UTC+5:30) using toLocaleString with Asia/Kolkata
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return istTime.getFullYear() + '-' +
        String(istTime.getMonth() + 1).padStart(2, '0') + '-' +
        String(istTime.getDate()).padStart(2, '0') + ' ' +
        String(istTime.getHours()).padStart(2, '0') + ':' +
        String(istTime.getMinutes()).padStart(2, '0') + ':' +
        String(istTime.getSeconds()).padStart(2, '0');
}

// Admin: Get all bookings (enriched)
app.get('/api/admin/bookings', verifyAdminToken, async (req, res) => {
    try {
        // Get all bookings with user details
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `);

        if (error) throw error;

        // Get all vehicles
        const { data: bikes } = await supabase.from('bikes').select('*');
        const { data: cars } = await supabase.from('cars').select('*');
        const { data: scooty } = await supabase.from('scooty').select('*');

        const allVehicles = [...(bikes || []), ...(cars || []), ...(scooty || [])];

        // Format the bookings data
        const enrichedBookings = bookings.map(booking => {
            // Find the vehicle
            const vehicle = allVehicles.find(v => v.id === booking.vehicle_id);

            // Calculate amounts based on vehicle price and duration
            const duration = parseInt(booking.duration) || 0;
            const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
            const totalAmount = duration * vehiclePrice;
            const advancePayment = parseFloat(booking.advance_payment) || 100; // Default advance payment
            const remainingAmount = totalAmount - advancePayment;

            return {
                id: booking.id,
                customerName: booking.users?.full_name || 'N/A',
                customerEmail: booking.users?.email || 'N/A',
                customerPhone: booking.users?.phone_number || 'N/A',
                vehicleName: vehicle ? vehicle.name : 'N/A',
                vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
                vehicleCategory: vehicle ? vehicle.category : booking.vehicle_category || 'N/A',
                start_date: booking.start_date || 'N/A',
                start_time: booking.start_time || 'N/A',
                duration: duration,
                total_amount: totalAmount,
                advance_payment: advancePayment,
                remaining_amount: remainingAmount,
                status: booking.status || 'pending',
                refund_amount: parseFloat(booking.refund_amount) || 0,
                refund_status: booking.refund_status || 'N/A',
                refund_timestamp: booking.refund_timestamp || null,
                refund_details: booking.refund_details || null,
                refund_deduction: booking.refund_deduction !== undefined && booking.refund_deduction !== null ? parseFloat(booking.refund_deduction) : 0,
                created_at: booking.created_at || null,
                confirmation_timestamp: booking.confirmation_timestamp || null,
                cancelled_timestamp: booking.cancelled_timestamp || null,
                transaction_id: booking.transaction_id || 'N/A'
            };
        });

        res.json({
            data: enrichedBookings,
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                total: bookings.length,
                pages: Math.ceil(bookings.length / (parseInt(req.query.limit) || 20))
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Get a single booking by ID (admin)
app.get('/api/admin/bookings/:id', verifyAdminToken, async (req, res) => {
    try {
        const { data: booking, error } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!booking) {
            console.log('Booking not found for ID:', req.params.id);
            return res.status(404).json({ error: 'Booking not found' });
        }

        console.log('Fetched booking:', booking);

        // Get vehicle details
        let vehicle;
        if (booking.vehicle_type === 'bike') {
            const { data } = await supabase.from('bikes').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'car') {
            const { data } = await supabase.from('cars').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'scooty') {
            const { data } = await supabase.from('scooty').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        }

        console.log('Vehicle lookup result:', vehicle);
        console.log('User lookup result:', booking.users);

        // Calculate amounts based on vehicle price and duration
        const duration = parseInt(booking.duration) || 0;
        const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
        const totalAmount = duration * vehiclePrice;
        const advancePayment = parseFloat(booking.advance_payment) || 100; // Default advance payment
        const remainingAmount = totalAmount - advancePayment;

        const enrichedBooking = {
            id: booking.id,
            customerName: booking.users?.full_name || 'N/A',
            customerEmail: booking.users?.email || 'N/A',
            customerPhone: booking.users?.phone_number || 'N/A',
            vehicleName: vehicle ? vehicle.name : 'N/A',
            vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
            vehicleCategory: vehicle ? vehicle.category : booking.vehicle_category || 'N/A',
            start_date: booking.start_date || 'N/A',
            start_time: booking.start_time || 'N/A',
            duration: duration,
            total_amount: totalAmount,
            advance_payment: advancePayment,
            remaining_amount: remainingAmount,
            status: booking.status || 'pending',
            refund_amount: parseFloat(booking.refund_amount) || 0,
            refund_status: booking.refund_status || 'N/A',
            refund_timestamp: booking.refund_timestamp || null,
            refund_details: booking.refund_details || null,
            refund_deduction: booking.refund_deduction !== undefined && booking.refund_deduction !== null ? parseFloat(booking.refund_deduction) : 0,
            created_at: booking.created_at || null,
            confirmation_timestamp: booking.confirmation_timestamp || null,
            cancelled_timestamp: booking.cancelled_timestamp || null,
            transaction_id: booking.transaction_id || 'N/A'
        };

        res.json(enrichedBooking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Error fetching booking' });
    }
});

// Admin: Delete booking
app.delete('/api/admin/bookings/:id', verifyAdminToken, async (req, res) => {
    try {
        const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Error deleting booking' });
    }
});

// Admin: Update booking
app.put('/api/admin/bookings/:id', verifyAdminToken, async (req, res) => {
    try {
        const { startDate, startTime, duration, status, totalAmount, advancePayment, remainingAmount } = req.body;
        const { data, error } = await supabase
            .from('bookings')
            .update({
                start_date: startDate,
                start_time: startTime,
                duration: duration,
                status: status,
                total_amount: totalAmount,
                advance_payment: advancePayment,
                remaining_amount: remainingAmount,
                updated_at: getISTTimestamp()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Error updating booking' });
    }
});

// Admin: Confirm booking
app.post('/api/admin/bookings/:id/confirm', verifyAdminToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        console.log('Confirming booking with ID:', bookingId);

        // First, fetch the booking with user and vehicle details
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    email,
                    full_name,
                    phone_number
                )
            `)
            .eq('id', bookingId)
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Get vehicle details
        let vehicle;
        if (booking.vehicle_type === 'bike') {
            const { data } = await supabase.from('bikes').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'car') {
            const { data } = await supabase.from('cars').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        } else if (booking.vehicle_type === 'scooty') {
            const { data } = await supabase.from('scooty').select('*').eq('id', booking.vehicle_id).single();
            vehicle = data;
        }

        // Always set confirmation_timestamp to current IST time
        const istTimestamp = getISTTimestamp();
        console.log('Setting confirmation_timestamp to (IST):', istTimestamp); // Debug log
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                confirmation_timestamp: istTimestamp,
                updated_at: istTimestamp
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // Send email notification with PDF invoice attached
        if (booking.users?.email && booking.users?.full_name) {
            try {
                const duration = parseInt(booking.duration) || 0;
                const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = parseFloat(booking.advance_payment) || 100;
                const remainingAmount = totalAmount - advancePayment;

                // Generate PDF invoice buffer
                const pdfBuffer = await generateInvoiceBuffer(
                    bookingId,
                    booking.users.full_name,
                    booking.users.email,
                    vehicle ? vehicle.name : 'Vehicle',
                    duration,
                    `${booking.start_date} ${booking.start_time}`,
                    totalAmount,
                    advancePayment
                );

                // Build Google Calendar link
                const dayjs = require('dayjs');
                const start = dayjs(`${booking.start_date}T${booking.start_time}`);
                const end = start.add(duration, 'hour');
                const formatForCal = (d) => {
                    const iso = (new Date(d)).toISOString();
                    return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                const gcalDates = `${formatForCal(start)}/${formatForCal(end)}`;
                const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
                const gcalText = encodeURIComponent(`RentHub booking ${bookingId} — ${vehicle ? vehicle.name : 'Vehicle'}`);
                const gcalDetails = encodeURIComponent(`Booking ID: ${bookingId}\nVehicle: ${vehicle ? vehicle.name : 'Vehicle'}\nPickup: ${booking.start_date} ${booking.start_time}`);
                const gcalUrl = `${gcalBase}&text=${gcalText}&dates=${gcalDates}&details=${gcalDetails}`;

                // Send email with PDF attachment
                const { sendEmail } = require('./config/emailService');
                const mailHtml = `
                    <div style="font-family: Arial, sans-serif; color: #222;">
                      <h2 style="color:#0b5cff;">Hello ${booking.users.full_name},</h2>
                      <p>Your booking is confirmed! Please find your invoice attached.</p>
                      <h3>Booking Details</h3>
                      <table style="width:100%; border-collapse: collapse;">
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Booking ID</b></td><td style="padding:6px; border:1px solid #eee;">${bookingId}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #eee;">${vehicle ? vehicle.name : 'Vehicle'}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Pickup Date & Time</b></td><td style="padding:6px; border:1px solid #eee;">${booking.start_date} ${booking.start_time}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Duration</b></td><td style="padding:6px; border:1px solid #eee;">${duration} hours</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Total Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${totalAmount}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Advance Paid</b></td><td style="padding:6px; border:1px solid #eee;">₹${advancePayment}</td></tr>
                        <tr><td style="padding:6px; border:1px solid #eee;"><b>Remaining Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${remainingAmount}</td></tr>
                      </table>
                      <p style="margin-top:12px;">
                        <a href="${gcalUrl}" style="display:inline-block;padding:10px 14px;background:#0b5cff;color:#fff;border-radius:4px;text-decoration:none;">Add to Google Calendar</a>
                      </p>
                      <hr style="margin-top:18px;" />
                      <p style="font-size:12px;color:#666;"><b>Pickup Instructions:</b> Please bring a valid ID and a printed or digital copy of this invoice. If you have any questions, call us.</p>
                      <p style="font-size:12px;color:#666;">If you find this email in spam, please mark as <b>Not Spam</b> to ensure future delivery.</p>
                      <footer style="margin-top:18px;padding-top:8px;border-top:1px solid #eee;color:#999;font-size:12px;">
                        <div>RentHub — Bike & Vehicle Rentals</div>
                        <div>support@renthub.example | +91 90000 00000</div>
                        <div>123 RentHub Street, City, Country</div>
                      </footer>
                    </div>
                `;

                const mailOptions = {
                    to: booking.users.email,
                    subject: 'Booking Confirmed – RentHub',
                    html: mailHtml,
                    attachments: [
                        { filename: 'booking_invoice.pdf', content: pdfBuffer }
                    ]
                };

                await sendEmail(mailOptions);
                console.log('✅ Booking confirmation email with PDF sent successfully to:', booking.users.email);
            } catch (emailError) {
                console.error('❌ Error sending booking confirmation email:', emailError);
                // Don't fail the booking confirmation if email fails
            }
        }

        // Make outbound call to user using Retell AI
        // Debug: Log the booking structure to understand data format
        console.log('📋 Booking data structure:', JSON.stringify(booking, null, 2));
        console.log('📋 Users data:', booking.users);

        // Handle different possible data structures from Supabase
        let userPhoneNumber = null;
        let userName = 'Customer';

        if (booking.users) {
            // Supabase might return users as an object or array
            if (Array.isArray(booking.users)) {
                userPhoneNumber = booking.users[0]?.phone_number;
                userName = booking.users[0]?.full_name || 'Customer';
            } else {
                userPhoneNumber = booking.users.phone_number;
                userName = booking.users.full_name || 'Customer';
            }
        }

        console.log('📞 Extracted phone number:', userPhoneNumber);
        console.log('👤 Extracted user name:', userName);

        if (userPhoneNumber) {
            try {
                const duration = parseInt(booking.duration) || 0;
                const vehiclePrice = vehicle ? parseFloat(vehicle.price) || 0 : 0;
                const totalAmount = duration * vehiclePrice;
                const advancePayment = parseFloat(booking.advance_payment) || 100;
                const remainingAmount = totalAmount - advancePayment;

                const bookingDetails = {
                    bookingId: bookingId,
                    vehicleName: vehicle ? vehicle.name : 'N/A',
                    vehicleType: vehicle ? vehicle.type : booking.vehicle_type || 'N/A',
                    startDate: booking.start_date || 'N/A',
                    startTime: booking.start_time || 'N/A',
                    duration: duration,
                    totalAmount: totalAmount,
                    advancePayment: advancePayment,
                    remainingAmount: remainingAmount,
                    userName: userName
                };

                console.log('📞 Initiating Retell AI call with details:', {
                    phoneNumber: userPhoneNumber,
                    bookingDetails: bookingDetails
                });

                const callResult = await makeBookingConfirmationCall(
                    userPhoneNumber,
                    bookingDetails
                );

                if (callResult.success) {
                    console.log('📞 Booking confirmation call initiated successfully');
                    console.log('Call ID:', callResult.callId);
                } else {
                    console.error('❌ Failed to initiate booking confirmation call:', callResult.error);
                    console.error('Call result details:', callResult);
                    // Don't fail the booking confirmation if call fails
                }
            } catch (callError) {
                console.error('❌ Error making booking confirmation call:', callError);
                console.error('Error stack:', callError.stack);
                // Don't fail the booking confirmation if call fails
            }
        } else {
            console.log('⚠️ No phone number available for booking confirmation call');
            console.log('Booking user data:', booking.users);
        }

        // Check if immediate reminder needed (for bookings within 2 hours)
        try {
            await sendImmediateReminderIfNeeded(bookingId);
        } catch (reminderError) {
            console.error('❌ Error sending immediate reminder:', reminderError);
            // Don't fail the booking confirmation if reminder fails
        }

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error confirming booking:', error);
        res.status(500).json({ error: 'Error confirming booking' });
    }
});

// Admin: Reject booking
app.post('/api/admin/bookings/:id/reject', verifyAdminToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);

        // First, fetch the booking without joins
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                id,
                user_id,
                vehicle_id,
                vehicle_type,
                start_date,
                start_time,
                duration,
                status,
                created_at,
                transaction_id,
                advance_payment
            `)
            .eq('id', bookingId)
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending bookings can be rejected' });
        }

        // Get the reason from the request body
        const reason = req.body && req.body.reason ? req.body.reason : null;
        const localTimestamp = getISTTimestamp();
        // Update booking status to rejected and save the reason, timestamps, and refund info
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                refund_status: 'completed',
                refund_amount: booking.advance_payment || 100,
                refund_details: { method: 'auto_reversal', original_tx: booking.transaction_id },
                rejection_timestamp: localTimestamp,
                refund_timestamp: localTimestamp,
                refund_deduction: 0
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // If the booking has a vehicle, update its availability
        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';

            const { error: vehicleError } = await supabase
                .from(vehicleTable)
                .update({ is_available: true })
                .eq('id', booking.vehicle_id);

            if (vehicleError) {
                console.error('Error updating vehicle availability:', vehicleError);
            }
        }

        // Fetch user details separately
        let userData = null;
        if (booking.user_id) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('email, full_name, phone_number')
                .eq('id', booking.user_id)
                .single();

            if (!userError) {
                userData = user;
            }
        }

        // Fetch vehicle details separately
        let vehicleData = null;
        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';

            const { data: vehicle, error: vehicleError } = await supabase
                .from(vehicleTable)
                .select('*')
                .eq('id', booking.vehicle_id)
                .single();

            if (!vehicleError) {
                vehicleData = vehicle;
            }
        }

        res.json({
            message: 'Booking rejected successfully',
            booking: {
                ...booking,
                user: userData,
                vehicle: vehicleData
            }
        });
    } catch (error) {
        console.error('Error in reject booking endpoint:', error);
        res.status(500).json({
            error: 'Error rejecting booking',
            details: error.message
        });
    }
});

// Admin: Mark refund as completed
app.post('/api/admin/bookings/:id/refund-complete', verifyAdminToken, async (req, res) => {
    console.log('Received request to mark refund as complete for booking:', req.params.id);
    try {
        const bookingId = parseInt(req.params.id);
        const adminId = req.user.id;

        // Verify admin status
        const { data: admin, error: adminError } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', adminId)
            .single();

        if (adminError || !admin || !admin.is_admin) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Update the booking refund status with IST timestamp
        const { data: booking, error: updateError } = await supabase
            .from('bookings')
            .update({
                refund_status: 'completed',
                refund_timestamp: getISTTimestamp(),
                refund_completed_by: adminId
            })
            .eq('id', bookingId)
            .select('*, users:user_id(email, full_name)')
            .single();

        if (updateError) {
            console.error('Error updating refund status:', updateError);
            return res.status(500).json({ error: 'Failed to update refund status' });
        }

        // Log the refund completion
        await supabase
            .from('activity_log')
            .insert({
                admin_id: adminId,
                action: 'refund_completed',
                booking_id: bookingId,
                details: {
                    refund_amount: booking.refund_amount,
                    payment_method: booking.refund_details?.method || 'unknown'
                }
            });

        // Send refund completion email to user
        if (booking.users?.email) {
            const { sendRefundCompleteEmail } = require('./config/emailService');
            await sendRefundCompleteEmail(
                booking.users.email,
                booking.users.full_name,
                booking.id,
                booking.refund_amount,
                booking.refund_timestamp,
                booking.refund_details
            );
        }

        res.json({ message: 'Refund marked as completed', booking });
    } catch (error) {
        console.error('Error completing refund:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SOS: Send activation link to user
app.post('/api/admin/send-sos', verifyAdminToken, async (req, res) => {
    try {
        const { bookingId } = req.body;

        // Fetch the booking with user details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, users:user_id(email, full_name, phone_number)')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if booking is confirmed
        if ((booking.status || '').toLowerCase() !== 'confirmed') {
            return res.status(400).json({ error: 'SOS can only be sent for confirmed bookings' });
        }

        // Get user email
        let userEmail = null;
        let userName = 'User';
        if (booking.users) {
            if (Array.isArray(booking.users)) {
                userEmail = booking.users[0]?.email;
                userName = booking.users[0]?.full_name || 'User';
            } else {
                userEmail = booking.users.email;
                userName = booking.users.full_name || 'User';
            }
        }

        if (!userEmail) {
            return res.status(404).json({ error: 'User email not found' });
        }

        // Generate unique SOS token
        const sosToken = crypto.randomBytes(32).toString('hex');
        const sosActivationLink = `https://rentahub-service.vercel.app/sos-activate?token=${sosToken}&bookingId=${bookingId}`;

        // Store SOS token in a simple variable/cache (since DB columns don't exist)
        // In production, you'd want to store this in a separate SOS_tokens table or cache like Redis
        if (!global.sosTokens) {
            global.sosTokens = {};
        }
        global.sosTokens[sosToken] = {
            bookingId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        // Send SOS link email to user
        const emailResult = await sendSOSLinkEmail(userEmail, userName, sosActivationLink);

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send email: ' + emailResult.error });
        }

        res.json({
            success: true,
            message: 'SOS activation link sent to ' + userEmail
        });
    } catch (error) {
        res.status(500).json({ error: 'Error sending SOS: ' + error.message });
    }
});


// Admin: Cancel booking
app.post('/api/admin/bookings/:id/cancel', verifyAdminToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        console.log('Processing booking cancellation for ID:', bookingId);

        // First, fetch the booking
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users:user_id(*)')
            .eq('id', bookingId)
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({ error: 'Only confirmed bookings can be cancelled' });
        }

        // Calculate refund amount based on time since confirmation
        const now = new Date();
        const confirmationTime = booking.confirmation_timestamp ? new Date(booking.confirmation_timestamp) : now;
        const hoursSinceConfirmation = (now - confirmationTime) / (1000 * 60 * 60);

        console.log('Booking cancellation debug:', {
            confirmation_timestamp: booking.confirmation_timestamp,
            now: new Date().toISOString(),
            advance_payment: booking.advance_payment
        });

        let refundAmount = 0;
        // Calculate refund based on advance payment only
        const advancePayment = parseFloat(booking.advance_payment) || 100; // Default to 100 if not set
        if (hoursSinceConfirmation <= 2) {
            // Full refund of advance payment
            refundAmount = advancePayment;
        } else {
            // 70% refund of advance payment
            refundAmount = Math.round(advancePayment * 0.7);
        }

        console.log('hoursSinceConfirmation:', hoursSinceConfirmation);

        // Calculate deduction
        let deductionAmount = 0;
        if (hoursSinceConfirmation > 2) {
            deductionAmount = Math.round(advancePayment * 0.3);
        }
        // Use local time for cancelled_timestamp
        const nowCancel = new Date();
        const localCancelTimestamp = nowCancel.getFullYear() + '-' +
            String(nowCancel.getMonth() + 1).padStart(2, '0') + '-' +
            String(nowCancel.getDate()).padStart(2, '0') + ' ' +
            String(nowCancel.getHours()).padStart(2, '0') + ':' +
            String(nowCancel.getMinutes()).padStart(2, '0') + ':' +
            String(nowCancel.getSeconds()).padStart(2, '0');
        // Update booking status to cancelled with refund details, timestamps, and deduction
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled',
                refund_amount: refundAmount,
                refund_status: 'processing',
                refund_details: req.body && req.body.refundDetails ? req.body.refundDetails : null,
                cancelled_timestamp: localCancelTimestamp,
                refund_deduction: deductionAmount
            })
            .eq('id', bookingId)
            .select('*, users:user_id(*)')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // Update vehicle availability back to true
        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';

            const { error: vehicleError } = await supabase
                .from(vehicleTable)
                .update({ is_available: true })
                .eq('id', booking.vehicle_id);

            if (vehicleError) {
                console.error('Error updating vehicle:', vehicleError);
            }
        }

        console.log('Booking cancelled successfully:', updatedBooking);

        res.json({
            message: 'Booking cancelled successfully',
            refundAmount,
            booking: updatedBooking
        });
    } catch (error) {
        console.error('Error in cancel booking endpoint:', error);
        res.status(500).json({
            error: 'Error cancelling booking',
            details: error.message
        });
    }
});

// Function to check for time-based booking conflicts
async function checkTimeConflict(vehicleId, startDate, startTime, duration) {
    try {
        const { data: existingBookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .eq('start_date', startDate)
            .neq('status', 'cancelled')
            .neq('status', 'rejected');

        if (error) {
            console.error('Supabase error in checkTimeConflict:', error);
            throw error;
        }

        if (!Array.isArray(existingBookings)) {
            console.error('existingBookings is not an array:', existingBookings);
            return { conflict: false };
        }

        // Convert start time to minutes for easier comparison
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = startTimeMinutes + (duration * 60);
        // Add 1-hour buffer before and after
        const bufferStartTime = startTimeMinutes - 60;
        const bufferEndTime = endTimeMinutes + 60;
        for (const booking of existingBookings) {
            // Check if start_time exists
            if (!booking.start_time) continue;

            const [existingHour, existingMinute] = booking.start_time.split(':').map(Number);
            const existingStartTimeMinutes = existingHour * 60 + existingMinute;
            const existingEndTimeMinutes = existingStartTimeMinutes + (booking.duration * 60);

            // Calculate existing end time for the message
            const existingEndTotalMinutes = existingStartTimeMinutes + (booking.duration * 60);
            const existingEndHour = Math.floor(existingEndTotalMinutes / 60) % 24;
            const existingEndMinute = existingEndTotalMinutes % 60;
            const formattedEndTime = `${existingEndHour.toString().padStart(2, '0')}:${existingEndMinute.toString().padStart(2, '0')}`;

            // Check for overlap (including 1 hour buffer)
            if (existingStartTimeMinutes < bufferEndTime && existingEndTimeMinutes > bufferStartTime) {
                // Format the date in a readable format
                const bookingDate = new Date(booking.start_date);
                const formattedDate = bookingDate.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return {
                    conflict: true,
                    existingBooking: booking,
                    message: `This vehicle is already booked on ${formattedDate} from ${booking.start_time} to ${formattedEndTime}. Please try another vehicle or choose a different time slot. (Note: A 1-hour gap is required before and after each booking)`
                };
            }
        }
        return { conflict: false };
    } catch (error) {
        console.error('Error checking time conflict:', error);
        throw error;
    }
}

// User Registration
// Send registration OTP - call this when the user/admin enters email and requests verification
app.post('/api/register/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // If user already exists, don't send OTP
        const existingUser = await SupabaseDB.getUserByEmail(email);
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Remove any previous OTPs for this email and insert the new OTP
        await supabase.from('password_reset_otps').delete().eq('email', email);
        const { error: otpError } = await supabase.from('password_reset_otps').insert({
            user_id: null,
            email: email,
            otp: otp,
            expires_at: otpExpiry,
            created_at: new Date().toISOString()
        });

        if (otpError) {
            console.error('Error storing registration OTP:', otpError);
            return res.status(500).json({ error: 'Error generating OTP' });
        }

        // Send OTP email
        const emailResult = await sendRegistrationOTP(email, '', otp);
        if (!emailResult.success) {
            console.error('Failed to send registration OTP:', emailResult.error);
            return res.status(500).json({ error: 'Failed to send OTP email' });
        }

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Error in /api/register/send-otp:', error);
        res.status(500).json({ error: 'Error sending OTP' });
    }
});

app.post('/api/register/user', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password, confirmPassword, otp } = req.body;

        // Check if user exists
        const existingUser = await SupabaseDB.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Verify OTP exists and not expired
        if (!otp) {
            return res.status(400).json({ error: 'OTP required to complete registration' });
        }

        const { data: otpRecord, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (otpError || !otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Validate passwords
        if (!confirmPassword) return res.status(400).json({ error: 'Please confirm your password' });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

        const { valid, errors } = validatePassword(password);
        if (!valid) return res.status(400).json({ error: 'Password validation failed', details: errors });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            full_name: fullName,
            email,
            phone_number: phoneNumber,
            password: hashedPassword,
            is_admin: false
        };

        const created = await SupabaseDB.createUser(newUser);

        // Delete used OTP record
        await supabase.from('password_reset_otps').delete().eq('id', otpRecord.id);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Admin Registration
app.post('/api/register/admin', async (req, res) => {
    try {
        const { adminName, email, adminId, password, confirmPassword, securityCode, otp } = req.body;

        if (securityCode !== '1575') {
            return res.status(403).json({ error: 'Invalid Security Code. You are not authorized to register as admin.' });
        }

        const existingUser = await SupabaseDB.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Verify OTP exists and not expired
        if (!otp) {
            return res.status(400).json({ error: 'OTP required to complete registration' });
        }

        const { data: otpRecord, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (otpError || !otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Validate passwords
        if (!confirmPassword) return res.status(400).json({ error: 'Please confirm your password' });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

        const { valid, errors } = validatePassword(password);
        if (!valid) return res.status(400).json({ error: 'Password validation failed', details: errors });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = {
            admin_name: adminName,
            email,
            admin_id: adminId,
            password: hashedPassword,
            is_admin: true
        };

        const created = await SupabaseDB.createUser(newAdmin);

        // Delete used OTP record
        await supabase.from('password_reset_otps').delete().eq('id', otpRecord.id);
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ error: 'Error registering admin' });
    }
});

// Debug endpoint to check user data (remove in production)
app.get('/api/debug/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        console.log('🔍 Debug: Checking user data for email:', email);

        const user = await SupabaseDB.getUserByEmail(email);
        console.log('📊 Debug: Raw user data:', user);

        if (!user) {
            return res.json({ error: 'User not found', email });
        }

        // Show both raw and mapped data
        const mappedUser = {
            id: user.id,
            fullName: user.full_name,
            adminName: user.admin_name,
            email: user.email,
            phoneNumber: user.phone_number,
            isAdmin: user.is_admin || false
        };

        res.json({
            raw: user,
            mapped: mappedUser,
            fields: {
                hasFullName: !!user.full_name,
                hasAdminName: !!user.admin_name,
                hasEmail: !!user.email,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        res.status(500).json({ error: 'Debug endpoint error', details: error.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔍 Login attempt for email:', email);

        const user = await SupabaseDB.getUserByEmail(email);
        console.log('📊 Raw user data from Supabase:', user);

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Prevent admin from logging in as user
        if (user.is_admin) {
            console.log('❌ Admin tried to login as user');
            return res.status(403).json({ error: 'Admins must login via Admin Portal' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            JWT_SECRET
        );

        // Map snake_case to camelCase for frontend compatibility
        const userResponse = {
            id: user.id,
            fullName: user.full_name,
            adminName: user.admin_name,
            email: user.email,
            phoneNumber: user.phone_number,
            isAdmin: user.is_admin || false
        };

        console.log('🎯 Mapped user response:', userResponse);
        console.log('✅ Login successful for:', userResponse.fullName || userResponse.adminName || userResponse.email);

        res.json({ token, user: userResponse });
    } catch (error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

// Admin Login
app.post('/api/login/admin', async (req, res) => {
    try {
        console.log('🔐 Admin login attempt started');
        const { email, password, adminId } = req.body;

        console.log('📧 Email:', email);
        console.log('🆔 Admin ID:', adminId);

        if (!email || !password || !adminId) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Email, password, and admin ID are required' });
        }

        // Find the admin by email
        console.log('🔍 Fetching admin from database...');
        const admin = await SupabaseDB.getUserByEmail(email);
        console.log('📊 Admin data retrieved:', admin ? 'Found' : 'Not found');

        if (!admin) {
            console.log('❌ No user found with email:', email);
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        console.log('👤 User found - is_admin:', admin.is_admin);
        console.log('🆔 Stored admin_id:', admin.admin_id);

        if (!admin.is_admin) {
            console.log('❌ User is not an admin');
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        if (admin.admin_id !== adminId) {
            console.log('❌ Admin ID mismatch. Expected:', admin.admin_id, 'Got:', adminId);
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        console.log('🔑 Verifying password...');
        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            console.log('❌ Invalid password');
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        console.log('✅ Password verified');
        console.log('🎫 Generating JWT token...');

        const token = jwt.sign(
            { id: admin.id, email: admin.email, isAdmin: admin.is_admin },
            JWT_SECRET
        );

        // Map snake_case to camelCase for frontend compatibility
        const adminResponse = {
            id: admin.id,
            fullName: admin.full_name,
            adminName: admin.admin_name,
            email: admin.email,
            phoneNumber: admin.phone_number,
            adminId: admin.admin_id,
            isAdmin: admin.is_admin || false
        };

        console.log('✅ Admin login successful for:', admin.email);
        res.json({ token, admin: adminResponse });
    } catch (error) {
        console.error('❌ Error during admin login:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Error during admin login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all vehicles
app.get('/api/vehicles/:type', async (req, res) => {
    const { type } = req.params;
    try {
        const vehicles = await SupabaseDB.getVehicles(type);
        res.json(vehicles);
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        res.status(500).json({ error: `Error fetching ${type}` });
    }
});

// Get a specific vehicle by type and ID
app.get('/api/vehicles/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;
        console.log('Requested type:', type, 'Requested id:', id);
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        console.log('Mapped type:', type, 'ID:', id);
        const vehicle = await SupabaseDB.getVehicleById(type, id);
        console.log('Vehicle result:', vehicle);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error(`Error fetching vehicle:`, error);
        res.status(500).json({ error: 'Error fetching vehicle' });
    }
});

// Check availability endpoint
app.post('/api/bookings/check-availability', verifyToken, async (req, res) => {
    try {
        const { vehicleId, startDate, startTime, duration } = req.body;

        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid time format. Please use HH:mm format (24-hour)' });
        }

        // Convert startTime to 24-hour format if needed
        const [hours, minutes] = startTime.split(':').map(Number);
        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Validate that booking is not in the past
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentIso = istNow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const bookingIso = `${startDate}T${formattedStartTime}`;

        if (bookingIso < currentIso) {
            console.log(`❌ Rejected past booking attempt: ${bookingIso} < ${currentIso}`);
            return res.status(400).json({ error: 'Cannot book for a past date or time.' });
        }

        const conflict = await checkTimeConflict(vehicleId, startDate, formattedStartTime, duration);
        if (conflict.conflict) {
            return res.status(409).json(conflict);
        }

        res.status(200).json({ available: true, message: 'Vehicle is available' });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Error checking availability' });
    }
});

// Create Razorpay Order
app.post('/api/payment/create-order', verifyToken, async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Error creating payment order', details: error });
    }
});

// Create booking
// Create new booking
app.post('/api/bookings', verifyToken, async (req, res) => {
    try {
        console.log('--- Booking Request Received ---');
        console.log('User:', req.user);
        console.log('Body:', req.body);
        const { vehicleId, startDate, startTime, duration, vehicleType, transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        // Verify Razorpay Payment if present
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
            const digest = shasum.digest('hex');

            if (digest !== razorpaySignature) {
                return res.status(400).json({ error: 'Payment verification failed! Invalid signature.' });
            }
            console.log('✅ Payment verified successfully');
        }
        // Validate time format (HH:mm)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ error: 'Invalid time format. Please use HH:mm format (24-hour)' });
        }
        // Convert startTime to 24-hour format if needed
        const [hours, minutes] = startTime.split(':').map(Number);
        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        // Check for time conflicts
        const conflict = await checkTimeConflict(vehicleId, startDate, formattedStartTime, duration);
        if (conflict.conflict) {
            return res.status(409).json(conflict);
        }

        // Validate that booking is not in the past
        const now = new Date();
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const bookingDateTime = new Date(`${startDate}T${formattedStartTime}:00`);

        // Adjust bookingDateTime to ensure it's treated as IST
        // (Since startDate string is purely date/time without offset, 
        // comparing it directly to a Date object created from IST string works if we align them correctly)
        // Better: Compare timestamps or string-sortable formats

        const currentIso = istNow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const bookingIso = `${startDate}T${formattedStartTime}`;

        if (bookingIso < currentIso) {
            return res.status(400).json({ error: 'Cannot book for a past date or time.' });
        }
        const bookingData = {
            user_id: req.user.id,
            vehicle_id: vehicleId,
            start_date: startDate,
            start_time: formattedStartTime, // Use formatted time
            duration,
            status: 'confirmed', // Confirmed since payment is verified
            vehicle_type: vehicleType,
            transaction_id: req.body.razorpayPaymentId || 'PENDING',
            confirmation_timestamp: getISTTimestamp(), // Add confirmation timestamp in IST
            advance_payment: req.body.advancePayment || 100 // Add advance payment
        };
        console.log('Booking data to insert:', bookingData);
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            // Check for unique constraint violation
            if (error.code === '23505' && (error.details?.includes('transaction_id') || error.message?.includes('transaction_id'))) {
                return res.status(409).json({ error: 'Transaction ID already exists.' });
            }
            // Return actual DB error for debugging (remove in production if needed, but useful now)
            return res.status(500).json({ error: 'Error creating booking', details: error.message, code: error.code, hint: error.hint });
        }

        console.log('Booking created:', data);

        // Async Background Notification: Email & Call
        (async () => {
            try {
                // 1. Fetch User Details
                const { data: userDetails } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', req.user.id)
                    .single();

                if (!userDetails) {
                    console.error('User not found for notification.');
                    return;
                }

                // 2. Fetch Vehicle Details (Name, etc.)
                let vehicleName = `Vehicle ${vehicleId}`;
                try {
                    const { data: vehicleData } = await supabase
                        .from(vehicleType) // 'bikes', 'cars', etc.
                        .select('name')
                        .eq('id', vehicleId)
                        .single();
                    if (vehicleData) vehicleName = vehicleData.name;
                } catch (vError) {
                    console.log('Could not fetch vehicle name:', vError);
                }

                // 3. Prepare Booking Details object
                const detailsForEmail = {
                    vehicleName: vehicleName,
                    vehicleType: vehicleType,
                    startDate: startDate,
                    startTime: formattedStartTime,
                    duration: duration,
                    totalAmount: req.body.totalAmount || 0,
                    advancePayment: req.body.advancePayment || 0,
                    remainingAmount: req.body.remainingAmount || 0,
                    confirmationTime: new Date().toLocaleString()
                };

                // 4. Send Email
                // 4. Send Rich Email with Invoice
                try {
                    // Generate PDF invoice buffer
                    const pdfBuffer = await generateInvoiceBuffer(
                        data.id, // bookingId
                        userDetails.full_name, // userName
                        userDetails.email, // userEmail
                        vehicleName,
                        duration,
                        `${startDate} ${formattedStartTime}`,
                        req.body.totalAmount || 0,
                        req.body.advancePayment || 0
                    );

                    // Build Google Calendar link
                    const dayjs = require('dayjs');
                    const start = dayjs(`${startDate}T${formattedStartTime}`);
                    const end = start.add(duration, 'hour');
                    const formatForCal = (d) => {
                        const iso = (new Date(d)).toISOString();
                        return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
                    };
                    const gcalDates = `${formatForCal(start)}/${formatForCal(end)}`;
                    const gcalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
                    const gcalText = encodeURIComponent(`RentHub booking ${data.id} — ${vehicleName}`);
                    const gcalDetails = encodeURIComponent(`Booking ID: ${data.id}\nVehicle: ${vehicleName}\nPickup: ${startDate} ${formattedStartTime}`);
                    const gcalUrl = `${gcalBase}&text=${gcalText}&dates=${gcalDates}&details=${gcalDetails}`;

                    // Construct Rich HTML Email
                    const mailHtml = `
                        <div style="font-family: Arial, sans-serif; color: #222;">
                          <h2 style="color:#0b5cff;">Hello ${userDetails.full_name},</h2>
                          <p>We are excited to let you know that your booking has been <b>confirmed</b> by the RentHub team. Please find your invoice attached.</p>
                          <h3>Booking Details</h3>
                          <table style="width:100%; border-collapse: collapse;">
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Booking ID</b></td><td style="padding:6px; border:1px solid #eee;">${data.id}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Vehicle</b></td><td style="padding:6px; border:1px solid #eee;">${vehicleName}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Pickup Date & Time</b></td><td style="padding:6px; border:1px solid #eee;">${startDate} ${formattedStartTime}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Duration</b></td><td style="padding:6px; border:1px solid #eee;">${duration} hours</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Total Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.totalAmount || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Advance Paid</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.advancePayment || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Remaining Amount</b></td><td style="padding:6px; border:1px solid #eee;">₹${req.body.remainingAmount || 0}</td></tr>
                            <tr><td style="padding:6px; border:1px solid #eee;"><b>Confirmation Time</b></td><td style="padding:6px; border:1px solid #eee;">${new Date().toLocaleString()}</td></tr>
                          </table>
                          <p style="margin-top:12px;">
                            <a href="${gcalUrl}" style="display:inline-block;padding:10px 14px;background:#0b5cff;color:#fff;border-radius:4px;text-decoration:none;">Add to Google Calendar</a>
                          </p>
                          <hr style="margin-top:18px;" />
                          <p style="font-size:12px;color:#666;"><b>Pickup Instructions:</b> Please bring a valid ID and a printed or digital copy of this invoice. If you have any questions, call us.</p>
                          <p style="font-size:12px;color:#666;">If you find this email in spam, please mark as <b>Not Spam</b> to ensure future delivery.</p>
                          <footer style="margin-top:18px;padding-top:8px;border-top:1px solid #eee;color:#999;font-size:12px;">
                            <div>RentHub — Bike & Vehicle Rentals</div>
                            <div>support@renthub.example | +91 90000 00000</div>
                            <div>123 RentHub Street, City, Country</div>
                          </footer>
                        </div>
                    `;

                    const mailOptions = {
                        to: userDetails.email,
                        subject: 'Booking Confirmed – RentHub',
                        html: mailHtml,
                        attachments: [
                            { filename: 'booking_invoice.pdf', content: pdfBuffer }
                        ]
                    };

                    const { sendEmail } = require('./config/emailService');
                    await sendEmail(mailOptions);
                    console.log(`📧 Rich confirmation email with PDF sent to ${userDetails.email}`);

                } catch (emailError) {
                    console.error('❌ Error generating invoice or sending email:', emailError);
                    // Fallback to simple email if PDF generation fails? Or just log it. 
                    // For now, we log it, so we don't block the call.
                }

                // 5. Trigger Retell AI Call
                if (userDetails.phone_number) {
                    const { makeBookingConfirmationCall } = require('./config/retellCallService');
                    const detailsForCall = {
                        bookingId: data.id,
                        vehicleName: vehicleName,
                        vehicleType: vehicleType,
                        startDate: startDate,
                        startTime: formattedStartTime,
                        duration: duration,
                        userName: userDetails.full_name
                    };
                    await makeBookingConfirmationCall(userDetails.phone_number, detailsForCall);
                    console.log(`📞 Confirmation call triggered for ${userDetails.phone_number}`);
                }

                // 6. Check if immediate reminder needed (for bookings within 2 hours)
                // Add delay to avoid rate limiting when both emails sent together
                try {
                    // Wait 2 seconds to ensure confirmation email is sent first
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sendImmediateReminderIfNeeded(data.id);
                } catch (reminderError) {
                    console.error('❌ Error sending immediate reminder:', reminderError);
                    // Don't fail the booking if reminder fails
                }

            } catch (notifyError) {
                console.error('❌ Error in background notification task:', notifyError);
            }
        })();

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error creating booking', details: error.message || error });
    }
});

// Get user bookings
// Get user bookings
app.get('/api/bookings/user', verifyToken, async (req, res) => {
    try {
        const bookings = await SupabaseDB.getBookingsByUser(req.user.id);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

// Dashboard Stats
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        // Total vehicles = bikes + cars + scooty
        const { count: bikeCount } = await supabase.from('bikes').select('id', { count: 'exact', head: true });
        const { count: carCount } = await supabase.from('cars').select('id', { count: 'exact', head: true });
        const { count: scootyCount } = await supabase.from('scooty').select('id', { count: 'exact', head: true });
        const totalVehicles = (bikeCount || 0) + (carCount || 0) + (scootyCount || 0);

        // Users
        const { count: activeUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });

        // Bookings
        const { count: totalBookingsMonth } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .gte('start_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

        const { count: pendingBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: confirmedBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed');
        const { count: cancelledBookings } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'cancelled');
        const { count: pendingRefunds } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .in('status', ['cancelled', 'rejected'])
            .eq('refund_status', 'processing');

        // Today's bookings
        const today = new Date().toISOString().split('T')[0];
        const { count: todaysBookings } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today + 'T00:00:00')
            .lt('created_at', today + 'T23:59:59');

        // Recent Activity (Last 5 bookings)
        const { data: recentBookings } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                created_at,
                users (full_name),
                vehicle_type
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        const recentActivity = (recentBookings || []).map(b => {
            let description = '';
            const userName = b.users?.full_name || 'User';
            let type = 'created';
            if (b.status === 'confirmed') type = 'confirmed';
            else if (b.status === 'cancelled') type = 'cancelled';
            else if (b.status === 'rejected') type = 'rejected';

            if (b.status === 'confirmed') description = `Booking #${b.id} confirmed for ${userName}`;
            else if (b.status === 'cancelled') description = `Booking #${b.id} cancelled by ${userName}`;
            else if (b.status === 'rejected') description = `Booking #${b.id} rejected`;
            else description = `New booking #${b.id} from ${userName}`;

            return {
                type,
                description,
                timestamp: b.created_at
            };
        });

        res.json({
            totalVehicles,
            totalBookingsMonth,
            activeUsers,
            pendingBookings,
            confirmedBookings,
            cancelledBookings,
            pendingRefunds,
            todaysBookings,
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        // Map snake_case to camelCase for frontend compatibility
        const mapped = (data || []).map(u => ({
            id: u.id,
            fullName: u.full_name,
            adminName: u.admin_name,
            email: u.email,
            phoneNumber: u.phone_number,
            isAdmin: u.is_admin,
            isBlocked: u.is_blocked
        }));
        res.json(mapped);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({ error: 'Error fetching admin users' });
    }
});

// Admin: Get all vehicles
app.get('/api/admin/vehicles', async (req, res) => {
    try {
        const bikes = await supabase.from('bikes').select('*');
        const cars = await supabase.from('cars').select('*');
        const scooty = await supabase.from('scooty').select('*');
        const allVehicles = [
            ...(bikes.data || []).map(v => ({ ...v, type: 'bike' })),
            ...(cars.data || []).map(v => ({ ...v, type: 'car' })),
            ...(scooty.data || []).map(v => ({ ...v, type: 'scooty' }))
        ];
        res.json(allVehicles);
    } catch (error) {
        console.error('Error fetching admin vehicles:', error);
        res.status(500).json({ error: 'Error fetching admin vehicles' });
    }
});

// Admin: Get single user
app.get('/api/admin/users/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        // Map snake_case to camelCase
        const user = {
            id: data.id,
            fullName: data.full_name,
            adminName: data.admin_name,
            email: data.email,
            phoneNumber: data.phone_number,
            isAdmin: data.is_admin,
            isBlocked: data.is_blocked,
            createdAt: data.created_at
        };
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Admin: Update user
app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { fullName, email, phoneNumber } = req.body;
        const { data, error } = await supabase.from('users').update({ full_name: fullName, email, phone_number: phoneNumber }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error updating user' });
    }
});

// Admin: Block/Unblock user
app.patch('/api/admin/users/:id/block', async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const { data, error } = await supabase.from('users').update({ is_blocked: isBlocked }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Error updating user status' });
    }
});

// Admin: Get single vehicle
app.get('/api/admin/vehicles/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { data, error } = await supabase.from(type).select('*').eq('id', id).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ error: 'Error fetching vehicle' });
    }
});

// Admin: Update vehicle
app.put('/api/admin/vehicles/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { data, error } = await supabase.from(type).update(req.body).eq('id', id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Error updating vehicle' });
    }
});

// Admin: Delete vehicle
app.delete('/api/admin/vehicles/:type/:id', async (req, res) => {
    try {
        let { type, id } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';
        const { error } = await supabase.from(type).delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Error deleting vehicle' });
    }
});

// Admin: Get policies
app.get('/api/admin/policies', async (req, res) => {
    try {
        const { data, error } = await supabase.from('policies').select('*');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching policies:', error);
        res.status(500).json({ error: 'Error fetching policies' });
    }
});

// Admin: Add new vehicle
app.post('/api/admin/vehicles/:type', async (req, res) => {
    try {
        let { type } = req.params;
        if (type === 'car') type = 'cars';
        if (type === 'bike') type = 'bikes';
        if (type === 'scooty') type = 'scooty';

        const { data, error } = await supabase
            .from(type)
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).json({ error: 'Error adding vehicle' });
    }
});

// User: Cancel their own booking
app.post('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.user.id;
        console.log('Processing user booking cancellation for ID:', bookingId);

        // First, fetch the booking
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users:user_id(*)')
            .eq('id', bookingId)
            .eq('user_id', userId) // Ensure the booking belongs to the user
            .single();

        if (fetchError) {
            console.error('Error fetching booking:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({ error: 'Only confirmed bookings can be cancelled' });
        }

        // Calculate refund amount based on time since confirmation
        const now = new Date();
        const confirmationTime = booking.confirmation_timestamp ? new Date(booking.confirmation_timestamp) : now;
        const hoursSinceConfirmation = (now - confirmationTime) / (1000 * 60 * 60);

        console.log('Booking cancellation debug:', {
            confirmation_timestamp: booking.confirmation_timestamp,
            now: new Date().toISOString(),
            advance_payment: booking.advance_payment
        });

        let refundAmount = 0;
        // Calculate refund based on advance payment only
        const advancePayment = parseFloat(booking.advance_payment) || 100; // Default to 100 if not set
        if (hoursSinceConfirmation <= 2) {
            // Full refund of advance payment
            refundAmount = advancePayment;
        } else {
            // 70% refund of advance payment
            refundAmount = Math.round(advancePayment * 0.7);
        }

        console.log('hoursSinceConfirmation:', hoursSinceConfirmation);

        // Calculate deduction
        let deductionAmount = 0;
        if (hoursSinceConfirmation > 2) {
            deductionAmount = Math.round(advancePayment * 0.3);
        }
        // Use local time for cancelled_timestamp
        const nowCancel = new Date();
        const localCancelTimestamp = nowCancel.getFullYear() + '-' +
            String(nowCancel.getMonth() + 1).padStart(2, '0') + '-' +
            String(nowCancel.getDate()).padStart(2, '0') + ' ' +
            String(nowCancel.getHours()).padStart(2, '0') + ':' +
            String(nowCancel.getMinutes()).padStart(2, '0') + ':' +
            String(nowCancel.getSeconds()).padStart(2, '0');
        // Update booking status to cancelled with refund details, timestamps, and deduction
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled',
                refund_amount: refundAmount,
                refund_status: 'processing',
                refund_details: req.body && req.body.refundDetails ? req.body.refundDetails : null,
                cancelled_timestamp: localCancelTimestamp,
                refund_deduction: deductionAmount
            })
            .eq('id', bookingId)
            .select('*, users:user_id(*)')
            .single();

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return res.status(500).json({ error: 'Error updating booking status' });
        }

        // Update vehicle availability back to true
        if (booking.vehicle_id && booking.vehicle_type) {
            let vehicleTable = booking.vehicle_type;
            if (vehicleTable === 'car') vehicleTable = 'cars';
            if (vehicleTable === 'bike') vehicleTable = 'bikes';

            const { error: vehicleError } = await supabase
                .from(vehicleTable)
                .update({ is_available: true })
                .eq('id', booking.vehicle_id);

            if (vehicleError) {
                console.error('Error updating vehicle:', vehicleError);
            }
        }

        console.log('Booking cancelled successfully:', updatedBooking);

        res.json({
            message: 'Booking cancelled successfully',
            refundAmount,
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ error: 'Error cancelling booking' });
    }
});

// Endpoint for user to submit refund details for a rejected booking
app.post('/api/bookings/:id/refund-details', verifyToken, async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id);
        const userId = req.user.id;

        // Fetch the booking
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Fetch error in refund-details endpoint:', fetchError);
            return res.status(500).json({ error: 'Error fetching booking details' });
        }
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }
        if (booking.status !== 'rejected') {
            return res.status(400).json({ error: 'Refund details can only be submitted for rejected bookings' });
        }
        if (!req.body || !req.body.refundDetails) {
            return res.status(400).json({ error: 'Missing refund details' });
        }

        // Set refund_amount and refundAmount to full advance payment (default 100 if not set)
        const advancePayment = booking.advance_payment || booking.advancePayment || 100;

        // Update the booking with refund details, refund amount, and set refund_status to 'processing'
        const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
                refund_details: req.body.refundDetails,
                refund_amount: advancePayment,
                refund_status: 'processing',
                refund_deduction: 0 // Set deduction to 0 for rejected refunds (change if needed)
            })
            .eq('id', bookingId)
            .select('*')
            .single();

        if (updateError) {
            console.error('Update error in refund-details endpoint:', updateError);
            return res.status(500).json({ error: 'Error updating refund details' });
        }

        res.json({ message: 'Refund details submitted successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Catch error in refund-details endpoint:', error);
        res.status(500).json({ error: 'Error submitting refund details', details: error.message });
    }
});

// Forgot Password: Request OTP
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found with this email' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Store OTP in database (you might want to create a separate table for this)
        const { error: otpError } = await supabase
            .from('password_reset_otps')
            .upsert({
                user_id: user.id,
                email: user.email,
                otp: otp,
                expires_at: otpExpiry.toISOString(),
                created_at: new Date().toISOString()
            });

        if (otpError) {
            console.error('Error storing OTP:', otpError);
            return res.status(500).json({ error: 'Error generating OTP' });
        }

        // Send OTP email
        const emailResult = await sendPasswordResetOTP(user.email, user.full_name, otp);

        if (emailResult.success) {
            res.json({ message: 'OTP sent successfully to your email' });
        } else {
            console.error('Failed to send OTP email:', emailResult.error);
            res.status(500).json({ error: 'Failed to send OTP email' });
        }

    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ error: 'Error processing forgot password request' });
    }
});

// Admin forgot password: only send OTP if the email belongs to an admin user
app.post('/api/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Normalize email
        const normalized = String(email).trim().toLowerCase();

        // First check if there's an 'admins' table (preferred) — if not fall back to 'users' with is_admin flag
        let { data: adminRow, error: adminErr } = await supabase
            .from('admins')
            .select('id, email, full_name')
            .eq('email', normalized)
            .maybeSingle();

        if (adminErr && adminErr.code !== 'PGRST116') {
            // PGRST116 sometimes indicates no such table — ignore and fall back
            console.error('Error while checking admins table:', adminErr);
            // continue to fallback check
            adminRow = null;
        }

        if (!adminRow) {
            // fallback: check users table for is_admin=true
            const { data: userRow, error: userErr } = await supabase
                .from('users')
                .select('id, email, full_name, is_admin')
                .eq('email', normalized)
                .single();

            if (userErr || !userRow || !userRow.is_admin) {
                return res.status(404).json({ error: 'This email is not registered as admin' });
            }
            adminRow = userRow; // treat as admin
        }

        // At this point, we have an adminRow — generate OTP and persist to password_reset_otps
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Upsert OTP record, associate user_id when available
        const { error: otpError } = await supabase.from('password_reset_otps').upsert({
            user_id: adminRow.id || null,
            email: adminRow.email,
            otp: otp,
            expires_at: otpExpiry,
            created_at: new Date().toISOString()
        });

        if (otpError) {
            console.error('Error storing admin OTP:', otpError);
            return res.status(500).json({ error: 'Error generating OTP for admin' });
        }

        // Send OTP email to admin
        const emailResult = await sendPasswordResetOTP(adminRow.email, adminRow.full_name || 'Admin', otp);
        if (emailResult.success) {
            return res.json({ message: 'OTP sent successfully to admin email' });
        } else {
            console.error('Failed to send admin OTP email:', emailResult.error);
            return res.status(500).json({ error: 'Failed to send OTP email to admin' });
        }
    } catch (err) {
        console.error('Unhandled error in /api/admin/forgot-password:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password: Verify OTP and Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Verify OTP
        const { data: otpRecord, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (otpError || !otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // If no new password provided, just verify OTP
        if (!newPassword) {
            res.json({ message: 'OTP verified successfully' });
            return;
        }

        // Fetch user to check existing password (by user_id if available, else by email)
        let userRow = null;
        if (otpRecord.user_id) {
            const { data, error } = await supabase.from('users').select('id, password').eq('id', otpRecord.user_id).single();
            if (!error) userRow = data;
        } else {
            const { data, error } = await supabase.from('users').select('id, password').eq('email', email).single();
            if (!error) userRow = data;
        }

        // If user found, check that newPassword != old password
        if (userRow && userRow.password) {
            const isSame = await bcrypt.compare(newPassword, userRow.password);
            if (isSame) {
                return res.status(400).json({ error: 'This is your old password — please choose a different password' });
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        let updateResult;
        if (otpRecord.user_id) {
            updateResult = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', otpRecord.user_id);
        } else {
            // fallback: update by email if user_id was not stored
            updateResult = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('email', email);
        }

        if (updateResult.error) {
            console.error('Error updating password:', updateResult.error);
            return res.status(500).json({ error: 'Error updating password' });
        }

        // Delete used OTP
        await supabase
            .from('password_reset_otps')
            .delete()
            .eq('id', otpRecord.id);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

// Test Retell AI call endpoint (for testing purposes)
app.post('/api/test/retell-call', verifyAdminToken, async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const testBookingDetails = {
            bookingId: 'TEST123',
            vehicleName: 'Test Vehicle',
            vehicleType: 'bike',
            startDate: '2024-01-01',
            startTime: '10:00',
            duration: 2,
            totalAmount: 500,
            advancePayment: 100,
            remainingAmount: 400,
            userName: 'Test User'
        };

        console.log('🧪 Testing Retell AI call to:', phoneNumber);
        const callResult = await makeBookingConfirmationCall(phoneNumber, testBookingDetails);

        if (callResult.success) {
            res.json({
                success: true,
                message: 'Test call initiated successfully',
                callId: callResult.callId,
                data: callResult.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: callResult.error,
                details: callResult.details
            });
        }
    } catch (error) {
        console.error('Error testing Retell AI call:', error);
        res.status(500).json({ error: 'Error testing call', details: error.message });
    }
});

// Temporary email test endpoint (remove in production)
app.get('/test-email', async (req, res) => {
    try {
        const { sendPasswordResetOTP } = require('./config/emailService');
        const testEmail = process.env.EMAIL_USER || 'test@example.com';
        const result = await sendPasswordResetOTP(testEmail, 'Test User', '123456');
        res.json({
            success: true,
            message: 'Email test completed',
            result: result
        });
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            emailConfig: {
                user: process.env.EMAIL_USER ? 'Set' : 'Not set',
                pass: process.env.EMAIL_PASS ? 'Set' : 'Not set'
            }
        });
    }
});

// Debug endpoint to help check Supabase connectivity in deployed environments
// Safe: doesn't leak keys, only reports whether keys are set and attempts a small select
app.get('/debug/supabase', async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || null;
    const anonSet = !!process.env.SUPABASE_ANON_KEY;
    const serviceRoleSet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        // Try a simple small select to verify connectivity (table 'bikes' is expected in this app)
        const { data, error } = await supabase.from('bikes').select('id').limit(1);
        if (error) throw error;

        return res.json({
            success: true,
            supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
            anonKey: anonSet ? 'Set' : 'Not set',
            serviceRoleKey: serviceRoleSet ? 'Set' : 'Not set',
            sample: data || []
        });
    } catch (err) {
        // Provide helpful diagnostic info without returning secret values
        return res.status(500).json({
            success: false,

        });
    }
});

// SOS Activation Endpoint
app.post('/api/sos-activate', async (req, res) => {
    try {
        const { token, bookingId, gpsLocation } = req.body;

        // Basic validation
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }

        // Fetch booking details with user info
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone_number
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            console.error('Error fetching booking for SOS:', bookingError);
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Get vehicle details
        let vehicleName = 'Unknown Vehicle';

        // First, try to get vehicle name directly from booking if it exists
        if (booking.vehicle_name) {
            vehicleName = booking.vehicle_name;
            console.log('Vehicle name from booking:', vehicleName);
        } else if (booking.vehicle_type && booking.vehicle_id) {
            // Try to fetch from vehicle tables
            console.log('Fetching vehicle from DB - Type:', booking.vehicle_type, 'ID:', booking.vehicle_id);

            // Determine correct table name
            let tableName;
            if (booking.vehicle_type === 'scooty') {
                tableName = 'scooty'; // or 'scooties' depending on your schema
            } else if (booking.vehicle_type === 'bike') {
                tableName = 'bikes';
            } else {
                tableName = booking.vehicle_type + 's'; // Generic pluralization
            }

            console.log('Querying table:', tableName);

            const { data: vehicle, error: vehicleError } = await supabase
                .from(tableName)
                .select('name, model')
                .eq('id', booking.vehicle_id)
                .single();

            if (vehicleError) {
                console.error('Error fetching vehicle:', vehicleError);
                // Try alternative table name if first attempt fails
                if (tableName === 'scooty') {
                    const { data: altVehicle } = await supabase
                        .from('scooties')
                        .select('name, model')
                        .eq('id', booking.vehicle_id)
                        .single();
                    if (altVehicle) {
                        vehicleName = altVehicle.name || altVehicle.model || 'Unknown Vehicle';
                        console.log('Vehicle found in scooties table:', vehicleName);
                    }
                }
            } else if (vehicle) {
                vehicleName = vehicle.name || vehicle.model || 'Unknown Vehicle';
                console.log('Vehicle found:', vehicleName);
            }
        } else {
            console.log('No vehicle_type or vehicle_id in booking');
        }


        // Prepare SOS data
        let gpsString = 'Not Provided';
        let googleMapsLink = null;

        if (gpsLocation && typeof gpsLocation === 'object') {
            const { latitude, longitude, accuracy } = gpsLocation;
            gpsString = `Lat: ${latitude}, Lng: ${longitude} (Accuracy: ${accuracy}m)`;
            googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } else if (typeof gpsLocation === 'string') {
            gpsString = gpsLocation;
        }

        const sosData = {
            bookingId: booking.id,
            userName: booking.users?.full_name || 'Unknown User',
            userEmail: booking.users?.email || 'Unknown Email',
            phoneNumber: booking.users?.phone_number || 'Unknown Phone',
            bikeModel: vehicleName,
            pickupLocation: booking.pickup_location || 'GITA Autonomous College BBSR',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            gpsLocation: gpsString,
            googleMapsLink: googleMapsLink
        };

        // Fetch all admins from database
        const { data: admins, error: adminError } = await supabase
            .from('users')
            .select('email')
            .eq('is_admin', true);

        if (adminError) {
            console.error('Error fetching admins:', adminError);
            // Fallback to hardcoded email if DB fetch fails
            await sendSOSAlertEmail(ADMIN_EMAILS[0], sosData);
        } else if (admins && admins.length > 0) {
            // Send email to all admins
            const emailPromises = admins.map(admin => sendSOSAlertEmail(admin.email, sosData));
            await Promise.all(emailPromises);
        } else {
            console.warn('No admins found in database. Sending to fallback.');
            await sendSOSAlertEmail(ADMIN_EMAILS[0], sosData);
        }

        // Send response immediately, emails sent in background (or awaited above)
        res.json({ success: true, message: 'SOS alert sent successfully' });

    } catch (error) {
        console.error('Error processing SOS request:', error);
        res.status(500).json({ error: 'Internal server error processing SOS' });
    }
});

// ============================================
// REMINDER EMAIL SYSTEM
// ============================================

// Manual endpoint to trigger reminder check (for testing)
app.post('/api/admin/check-reminders', verifyAdminToken, async (req, res) => {
    try {
        console.log('📧 Manual reminder check triggered by admin');
        const result = await checkAndSendReminders();
        res.json(result);
    } catch (error) {
        console.error('Error in manual reminder check:', error);
        res.status(500).json({ error: 'Error checking reminders', details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Reminder scheduler - Optional (use only if not using external cron)
    const USE_INTERNAL_CRON = process.env.USE_INTERNAL_CRON === 'true';

    if (USE_INTERNAL_CRON) {
        console.log('🔔 Starting internal reminder email scheduler...');

        // Run immediately on startup
        checkAndSendReminders().catch(err => {
            console.error('Error in initial reminder check:', err);
        });

        // Then run every 5 minutes to ensure timely delivery
        const REMINDER_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
        setInterval(() => {
            console.log('⏰ Running scheduled reminder check...');
            checkAndSendReminders().catch(err => {
                console.error('Error in scheduled reminder check:', err);
            });
        }, REMINDER_CHECK_INTERVAL);

        console.log(`✅ Internal reminder scheduler active (checking every 15 minutes)`);
    } else {
        console.log('ℹ️  Internal cron disabled. Use external cron job to call /api/admin/check-reminders');
    }
});

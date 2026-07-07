const { uploadToSupabase } = require('../utils/supabaseStorage');
const SponsorModel = require('../models/sponsorModel');
const supabase = require('../config/supabase');
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

exports.addBike = async (req, res) => {
    try {
        const userId = req.user.id; // From middleware
        // Form Data
        const { name, bikeNumber, model, year, pricePerHour, type } = req.body;

        // Files from memory storage (multer)
        const imageFile = req.files['image'] ? req.files['image'][0] : null;
        const rcFile = req.files['rc'] ? req.files['rc'][0] : null;
        const insuranceFile = req.files['insurance'] ? req.files['insurance'][0] : null;
        const pucFile = req.files['puc'] ? req.files['puc'][0] : null;

        if (!name || !bikeNumber || !pricePerHour || !type) {
            return res.status(400).json({ error: 'Missing required fields (including vehicle type)' });
        }

        // Upload files to Supabase Storage
        const uploadPromises = [
            imageFile ? uploadToSupabase(imageFile, SUPABASE_BUCKET, 'bikes') : null,
            rcFile ? uploadToSupabase(rcFile, SUPABASE_BUCKET, 'documents') : null,
            insuranceFile ? uploadToSupabase(insuranceFile, SUPABASE_BUCKET, 'documents') : null,
            pucFile ? uploadToSupabase(pucFile, SUPABASE_BUCKET, 'documents') : null
        ];

        const [imageUrl, rcUrl, insuranceUrl, pucUrl] = await Promise.all(uploadPromises);

        // Prepare vehicle data for staging table
        // Matches the structure used in RentHub's addVehicle
        const vehicleData = {
            name,
            registration_number: bikeNumber,
            model,
            year: parseInt(year),
            price: parseFloat(pricePerHour), // Standardize to 'price'
            image_url: imageUrl,            // Standardize to 'image_url'
            rc_url: rcUrl,
            insurance_url: insuranceUrl,
            puc_url: pucUrl,
            sponsor_id: userId,
            is_available: false,
            is_approved: false,
            type: type // Use provided type
        };

        const newRequest = await SponsorModel.addSponsorVehicle(vehicleData);

        res.status(201).json({
            message: 'Vehicle submitted for approval',
            request: newRequest
        });

    } catch (error) {
        console.error('Error adding bike:', error);
        res.status(500).json({ error: 'Failed to add vehicle' });
    }
};

exports.getMyBikes = async (req, res) => {
    try {
        const userId = req.user.id;
        const bikes = await SponsorModel.getSponsorVehicles(userId);
        res.json({ bikes });
    } catch (error) {
        console.error('Error fetching bikes:', error);
        res.status(500).json({ error: 'Failed to fetch bikes' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get sponsor's vehicles
        const vehicles = await SponsorModel.getSponsorVehicles(userId);

        // Calculate vehicle status stats
        const totalVehicles = vehicles.length;
        const approvedVehicles = vehicles.filter(v => v.status === 'approved').length;
        const pendingVehicles = vehicles.filter(v => v.status === 'pending').length;
        const rejectedVehicles = vehicles.filter(v => v.status === 'rejected').length;

        // Fetch real revenue stats (using same source as Revenue page for consistency)
        const { grossRevenue, transactions, vehicleStats, netEarnings, totalWithdrawn } = await SponsorModel.getDetailedRevenueStats(userId);

        // Calculate Revenue Trend (Monthly for current year)
        const currentYear = new Date().getFullYear();
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyRevenue = monthsShort.map(m => ({ name: m, revenue: 0, bookings: 0 }));

        transactions.forEach(t => {
            if (t.type === 'Debit') return; // Skip withdrawals for revenue/booking charts

            const d = new Date(t.raw_date || t.date);
            if (d.getFullYear() === currentYear) {
                const monthIdx = d.getMonth();
                monthlyRevenue[monthIdx].revenue += t.amount;
                monthlyRevenue[monthIdx].bookings += 1;
            }
        });

        // Prepare Top Vehicles for Pie Chart
        const topVehicles = vehicleStats
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
            .map(v => ({ name: v.name, value: v.total }));

        // Calculate Total Ride Hours from vehicle stats
        const totalRideHours = vehicleStats.reduce((acc, curr) => acc + (curr.hours || 0), 0);

        res.json({
            totalBikes: totalVehicles,
            totalVehicles,
            approvedVehicles,
            pendingVehicles,
            rejectedVehicles,
            totalBookings: transactions.filter(t => t.type !== 'Debit').length, // Filter out withdrawals
            totalRideHours,
            totalRevenue: grossRevenue,
            netEarnings: netEarnings, // Use calculated net earnings (withdrawals deducted)
            totalWithdrawn: totalWithdrawn || 0,
            revenueChart: monthlyRevenue,
            vehicleChart: topVehicles,
            recentVehicles: vehicles.slice(0, 5)
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

exports.toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable, type } = req.body;

        if (!type || !['bike', 'car', 'scooty'].includes(type)) {
            return res.status(400).json({ error: 'Valid vehicle type (bike/car/scooty) is required' });
        }

        const vehicle = await SponsorModel.toggleVehicleAvailability(id, type, isAvailable);
        res.json({ message: 'Availability updated', vehicle });

    } catch (error) {
        console.error('Error toggling availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
};

exports.getRevenue = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await SponsorModel.getDetailedRevenueStats(userId);

        // 70% to Sponsor, 30% to Platform
        const gross = stats.grossRevenue || 0;
        const commission = stats.commission || (gross * 0.30);
        const net = stats.netEarnings || (gross - commission); // Use model calculation (deducts withdrawals)
        const withdrawn = stats.totalWithdrawn || 0;

        res.json({
            grossRevenue: gross,
            commission: commission,
            netEarnings: net,
            totalWithdrawn: withdrawn,
            transactions: stats.transactions || [],
            vehicleStats: stats.vehicleStats || []
        });
    } catch (error) {
        console.error('Error fetching revenue:', error);
        res.status(500).json({ error: 'Failed to fetch revenue stats' });
    }
};

/**
 * Get Sponsor Bookings
 */
exports.getBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get sponsor's vehicles
        const vehicles = await SponsorModel.getSponsorVehicles(userId);

        if (!vehicles || vehicles.length === 0) {
            return res.json({ bookings: [] });
        }

        // Create a map of vehicle details for quick lookup
        const vehicleMap = new Map();
        vehicles.forEach(v => {
            const key = `${v.id}-${v.type}`;
            vehicleMap.set(key, {
                name: v.name,
                model: v.model,
                registration_number: v.registration_number || v.bikeNumber,
                image_url: v.image_url || v.image,
                type: v.type
            });
        });

        const vehicleIds = vehicles.map(v => v.id);

        // 2. Fetch all bookings for these vehicles
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .in('vehicle_id', vehicleIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bookings:', error);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }

        // 3. Get unique user IDs from bookings
        const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];

        // 4. Fetch user details
        let userMap = new Map();
        if (userIds.length > 0) {
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, full_name, email, phone_number')
                .in('id', userIds);

            if (!userError && users) {
                users.forEach(u => {
                    userMap.set(u.id, {
                        name: u.full_name || 'Unknown Customer',
                        email: u.email,
                        phone: u.phone_number
                    });
                });
            }
        }

        // 5. Format bookings with enriched data
        const formattedBookings = bookings
            .map(b => {
                // Normalize vehicle type
                let vType = (b.vehicle_type || '').toLowerCase();
                if (vType === 'bikes') vType = 'bike';
                if (vType === 'cars') vType = 'car';
                if (vType === 'scooty' || vType === 'scooter') vType = 'scooty';

                const vehicleKey = `${b.vehicle_id}-${vType}`;
                const vehicle = vehicleMap.get(vehicleKey);

                // Skip if vehicle doesn't belong to this sponsor
                if (!vehicle) return null;

                const customer = userMap.get(b.user_id) || { name: 'Unknown Customer', email: '-', phone: '-' };

                // Calculate duration
                let duration = parseFloat(b.duration) || 0;
                if (b.ride_start_time && b.ride_end_time) {
                    const start = new Date(b.ride_start_time);
                    const end = new Date(b.ride_end_time);
                    const diffMs = end - start;
                    if (diffMs > 0) {
                        duration = diffMs / (1000 * 60 * 60); // Hours
                    }
                }

                return {
                    _id: b.id,
                    bookingId: b.booking_id || `BK${b.id}`,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    customerPhone: customer.phone,
                    vehicleName: vehicle.name,
                    vehicleModel: vehicle.model,
                    vehicleType: vehicle.type,
                    vehicleImage: vehicle.image_url,
                    registrationNumber: vehicle.registration_number,
                    startTime: b.ride_start_time || b.start_time || b.created_at,
                    endTime: b.ride_end_time || b.end_time,
                    bookingDate: b.booking_date || b.created_at,
                    totalHours: Math.round(duration * 10) / 10, // Round to 1 decimal
                    totalAmount: parseFloat(b.total_amount) || parseFloat(b.total_price) || 0,
                    status: b.status || 'pending',
                    // Payment Status Logic: If booking exists, payment is paid (unless explicitly pending)
                    paymentStatus: b.payment_status === 'pending' ? 'pending' : 'paid',
                    pickupLocation: b.pickup_location || '-',
                    dropLocation: b.drop_location || '-',
                    createdAt: b.created_at
                };
            })
            .filter(Boolean); // Remove nulls

        res.json({ bookings: formattedBookings });

    } catch (error) {
        console.error('Error fetching sponsor bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

exports.getFleetData = async (req, res) => {
    try {
        const vehicles = await SponsorModel.getAllVehiclesAdmin();
        const sponsors = await SponsorModel.getAllSponsorsAdmin();
        res.json({ vehicles, sponsors });
    } catch (e) {
        console.error('Error fetching fleet data:', e);
        res.status(500).json({ error: 'Failed to fetch fleet data' });
    }
};

exports.assignFleet = async (req, res) => {
    try {
        const { sponsorId, assignments } = req.body; // assignments: [{id, type}]

        if (!sponsorId || !assignments || !Array.isArray(assignments)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        let count = 0;
        for (const item of assignments) {
            await SponsorModel.assignVehicleToSponsor(item.id, item.type, sponsorId);
            count++;
        }
        res.json({ success: true, message: `Assigned ${count} vehicles successfully` });
    } catch (e) {
        console.error('Error assigning fleet:', e);
        res.status(500).json({ error: 'Failed to assign vehicles' });
    }
};

/**
 * Update Vehicle Details
 */
exports.updateVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;
        const { name, price, type } = req.body;

        // Determine table
        let tableName = 'bikes';
        if (type === 'car') tableName = 'cars';
        if (type === 'scooty' || type === 'scooter') tableName = 'scooty';

        // Verify ownership
        const { data: vehicle, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', vehicleId)
            .eq('sponsor_id', userId)
            .single();

        if (fetchError || !vehicle) {
            return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        }

        // Update
        const updateData = {};
        if (name) updateData.name = name;
        if (price) updateData.price = price;

        const { error: updateError } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', vehicleId);

        if (updateError) {
            console.error('Update error:', updateError);
            return res.status(500).json({ error: 'Failed to update vehicle' });
        }

        res.json({ success: true, message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
};

/**
 * Delete Vehicle
 */
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;
        const { type } = req.body;

        // Determine table
        let tableName = 'bikes';
        if (type === 'car') tableName = 'cars';
        if (type === 'scooty' || type === 'scooter') tableName = 'scooty';

        // Verify ownership
        const { data: vehicle, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', vehicleId)
            .eq('sponsor_id', userId)
            .single();

        if (fetchError || !vehicle) {
            return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        }

        // Delete
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', vehicleId);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return res.status(500).json({ error: 'Failed to delete vehicle' });
        }

        res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
};

exports.getSponsorEarningsReport = async (req, res) => {
    try {
        const rawStats = await SponsorModel.getSponsorEarningsReport();

        // Calculate derived fields
        // 1. Map to report format
        const report = (rawStats || []).map(stat => {
            const revenue = stat.revenue || 0;
            const share = revenue * 0.70;
            const fee = revenue * 0.30;
            const withdrawn = stat.withdrawn || 0;
            const balance = share - withdrawn;

            return {
                id: stat.id,
                name: stat.name,
                email: stat.email,
                totalRevenue: revenue,
                sponsorShare: share,
                platformFee: fee,
                withdrawn: withdrawn,
                balance: balance,
                bookings: stat.bookings,
                vehicleCount: stat.vehicleCount
            };
        });

        // 2. Calculate Totals for Summary Cards
        const totals = report.reduce((acc, curr) => ({
            totalRevenue: acc.totalRevenue + curr.totalRevenue,
            sponsorShare: acc.sponsorShare + curr.sponsorShare,
            platformFee: acc.platformFee + curr.platformFee,
            totalPaid: acc.totalPaid + curr.withdrawn,
            pendingBalance: acc.pendingBalance + curr.balance
        }), {
            totalRevenue: 0,
            sponsorShare: 0,
            platformFee: 0,
            totalPaid: 0,
            pendingBalance: 0
        });

        res.json({ report, totals });

    } catch (error) {
        console.error('Error generating sponsor report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};

// Get Sponsor Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: sponsor, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !sponsor) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        res.json({ sponsor });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update Sponsor Profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phone, address } = req.body;

        const updateData = {};
        if (fullName) updateData.full_name = fullName;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        const { data: sponsor, error } = await supabase
            .from('sponsors')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({ sponsor, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upload Profile Picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Upload to Supabase Storage
        const imageUrl = await uploadToSupabase(imageFile, SUPABASE_BUCKET, 'profile-pictures');

        if (!imageUrl) {
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        // Update sponsor profile with new image URL
        const { data: sponsor, error } = await supabase
            .from('sponsors')
            .update({ profile_picture: imageUrl })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile picture:', error);
            return res.status(500).json({ error: 'Failed to update profile picture' });
        }

        res.json({
            sponsor,
            profilePicture: imageUrl,
            message: 'Profile picture updated successfully'
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
};

/**
 * Check Date Availability for Vehicle
 * Checks if a vehicle has any bookings on a specific date
 */
exports.checkDateAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const { vehicleId, vehicleType, date } = req.body;

        if (!vehicleId || !vehicleType || !date) {
            return res.status(400).json({ error: 'Vehicle ID, type, and date are required' });
        }

        // Validate vehicle type
        if (!['bike', 'car', 'scooty'].includes(vehicleType)) {
            return res.status(400).json({ error: 'Invalid vehicle type' });
        }

        // Determine table name
        let tableName = 'bikes';
        if (vehicleType === 'car') tableName = 'cars';
        if (vehicleType === 'scooty') tableName = 'scooty';

        // Verify vehicle ownership
        const { data: vehicle, error: vehicleError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', vehicleId)
            .eq('sponsor_id', userId)
            .single();

        if (vehicleError || !vehicle) {
            return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        }

        // Parse the selected date
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

        console.log(`[CheckAvailability] Checking ${vehicleType} ${vehicleId} for date: ${date}`);
        console.log(`[CheckAvailability] Query Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        // Check for bookings on this date
        // supporting multiple column naming conventions (ride_start_time vs start_date)
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .or(`and(ride_start_time.lte.${endOfDay.toISOString()},ride_end_time.gte.${startOfDay.toISOString()}),and(start_date.lte.${endOfDay.toISOString()},end_date.gte.${startOfDay.toISOString()}),and(booking_date.gte.${startOfDay.toISOString()},booking_date.lte.${endOfDay.toISOString()})`)
            .in('status', ['pending', 'confirmed', 'active', 'ride_started', 'ongoing']);

        if (bookingError) {
            console.error('[CheckAvailability] Database error:', bookingError);

            // Fallback: Check using simple date match if complex query fails
            // This handles cases where maybe status is different or column issues
            const { data: fallbackBookings, error: fallbackError } = await supabase
                .from('bookings')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .in('status', ['pending', 'confirmed', 'active', 'ride_started', 'ongoing']); // Fetch all active bookings for vehicle

            // Manual filter in code as last resort
            if (!fallbackError && fallbackBookings) {
                const matchingBooking = fallbackBookings.find(b => {
                    const start = new Date(b.ride_start_time || b.start_date || b.booking_date);
                    const end = new Date(b.ride_end_time || b.end_date || b.booking_date || start);
                    return start <= endOfDay && end >= startOfDay;
                });

                if (matchingBooking) {
                    console.log('[CheckAvailability] Found booking via fallback JS filtering');
                    return res.json({
                        hasBooking: true,
                        bookingDetails: matchingBooking
                    });
                }
            }
        }

        // Check if any bookings found
        if (bookings && bookings.length > 0) {
            console.log(`[CheckAvailability] Found ${bookings.length} conflicting bookings.`);
            // Return the first active booking
            return res.json({
                hasBooking: true,
                bookingDetails: bookings[0]
            });
        }

        console.log('[CheckAvailability] No bookings found.');
        // No bookings found
        res.json({
            hasBooking: false,
            message: 'No bookings found for this date'
        });

    } catch (error) {
        console.error('Error checking date availability:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
};


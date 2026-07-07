const supabase = require('../config/supabase');
const { normalizeVehicleType } = require('../utils/vehicleTypeNormalizer');

class SponsorModel {

    // ============================================
    // SPONSOR ACCOUNT OPERATIONS
    // ============================================

    static async createSponsorAccount(sponsorData) {
        const { data, error } = await supabase
            .from('sponsors')
            .insert([sponsorData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getSponsorByEmail(email) {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async getSponsorById(id) {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async updateSponsor(id, updateData) {
        const { data, error } = await supabase
            .from('sponsors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // VEHICLE REQUEST OPERATIONS
    // ============================================

    static async addSponsorVehicle(vehicleData) {
        const { sponsor_id, type, name, registration_number, model, year, price, image_url, rc_url, insurance_url, puc_url } = vehicleData;

        const { data, error } = await supabase
            .from('sponsor_vehicle_requests')
            .insert([{
                sponsor_id: sponsor_id,
                vehicle_type: type,
                name: name,
                registration_number: registration_number,
                model: model,
                year: year,
                price: price,
                image_url: image_url,
                rc_url: rc_url,
                insurance_url: insurance_url,
                puc_url: puc_url,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getSponsorVehicles(sponsorId) {
        // Fetch LIVE vehicles
        const [bikes, cars, scooty] = await Promise.all([
            supabase.from('bikes').select('*').eq('sponsor_id', sponsorId),
            supabase.from('cars').select('*').eq('sponsor_id', sponsorId),
            supabase.from('scooty').select('*').eq('sponsor_id', sponsorId)
        ]);

        // Fetch PENDING/REJECTED requests
        const { data: requests, error } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*')
            .eq('sponsor_id', sponsorId);

        if (error) {
            console.error("Error fetching requests:", error);
            return [];
        }

        // Fetch all bookings for this sponsor's vehicles (match Revenue page logic)
        const { data: allBookings } = await supabase
            .from('bookings')
            .select('*')
            .in('status', ['completed', 'ride_completed', 'ride_ended', 'payment_success']);

        // Create a map of vehicle stats from bookings
        const vehicleStatsMap = {};

        if (allBookings && allBookings.length > 0) {
            allBookings.forEach(booking => {
                // Normalize vehicle type (bikes -> bike, cars -> car)
                let vType = (booking.vehicle_type || '').toLowerCase();
                if (vType === 'bikes') vType = 'bike';
                if (vType === 'cars') vType = 'car';
                if (vType === 'scooty' || vType === 'scooter') vType = 'scooty';

                const key = `${booking.vehicle_id}-${vType}`;

                if (!vehicleStatsMap[key]) {
                    vehicleStatsMap[key] = {
                        totalBookings: 0,
                        totalRideHours: 0,
                        totalRevenue: 0
                    };
                }

                // Calculate Duration (same logic as Revenue page)
                let rideDuration = parseFloat(booking.duration) || 0;
                if (booking.ride_start_time && booking.ride_end_time) {
                    const start = new Date(booking.ride_start_time);
                    const end = new Date(booking.ride_end_time);
                    const diffMs = end - start;
                    if (diffMs > 0) {
                        rideDuration = diffMs / (1000 * 60 * 60); // Hours with decimals
                    }
                }

                vehicleStatsMap[key].totalBookings += 1;
                vehicleStatsMap[key].totalRideHours += rideDuration;
                vehicleStatsMap[key].totalRevenue += booking.total_amount || booking.total_price || 0;
            });
        }

        const liveVehicles = [
            ...(bikes.data || []).map(v => {
                const key = `${v.id}-bike`;
                const stats = vehicleStatsMap[key] || { totalBookings: 0, totalRideHours: 0, totalRevenue: 0 };
                return {
                    ...v,
                    type: 'bike',
                    status: 'approved',
                    approval_status: 'approved',
                    image: v.image_url,
                    bikeNumber: v.registration_number,
                    totalBookings: stats.totalBookings,
                    totalRideHours: stats.totalRideHours,
                    totalRevenue: stats.totalRevenue
                };
            }),
            ...(cars.data || []).map(v => {
                const key = `${v.id}-car`;
                const stats = vehicleStatsMap[key] || { totalBookings: 0, totalRideHours: 0, totalRevenue: 0 };
                return {
                    ...v,
                    type: 'car',
                    status: 'approved',
                    approval_status: 'approved',
                    image: v.image_url,
                    bikeNumber: v.registration_number,
                    totalBookings: stats.totalBookings,
                    totalRideHours: stats.totalRideHours,
                    totalRevenue: stats.totalRevenue
                };
            }),
            ...(scooty.data || []).map(v => {
                const key = `${v.id}-scooty`;
                const stats = vehicleStatsMap[key] || { totalBookings: 0, totalRideHours: 0, totalRevenue: 0 };
                return {
                    ...v,
                    type: 'scooty',
                    status: 'approved',
                    approval_status: 'approved',
                    image: v.image_url,
                    bikeNumber: v.registration_number,
                    totalBookings: stats.totalBookings,
                    totalRideHours: stats.totalRideHours,
                    totalRevenue: stats.totalRevenue
                };
            })
        ];

        // Filter out requests that are already approved (since they are in liveVehicles)
        // Or better yet, just show pending/rejected ones from requests table
        const pendingOrRejected = (requests || []).filter(r => r.status !== 'approved').map(r => ({
            id: r.id,
            _id: r.id,
            name: r.name,
            model: r.model,
            price: r.price,
            year: r.year,
            image: r.image_url,
            image_url: r.image_url,
            bikeNumber: r.registration_number,
            registration_number: r.registration_number,
            status: r.status,
            approval_status: r.status, // pending or rejected
            vehicleType: r.vehicle_type,
            is_available: false,
            totalBookings: 0,
            totalRideHours: 0,
            totalRevenue: 0
        }));


        return [...liveVehicles, ...pendingOrRejected];
    }

    static async toggleVehicleAvailability(id, type, isAvailable) {
        let tableName;
        if (type === 'bike') tableName = 'bikes';
        else if (type === 'car') tableName = 'cars';
        else if (type === 'scooty') tableName = 'scooty';
        else throw new Error('Invalid vehicle type');

        const { data, error } = await supabase
            .from(tableName)
            .update({ is_available: isAvailable })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ============================================
    // ADMIN OPERATIONS
    // ============================================

    static async getPendingVehicles() {
        const { data, error } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*, sponsors(full_name, phone_number)')
            .eq('status', 'pending');

        if (error) throw error;

        // Map it to look like the vehicle object for Frontend consistency
        return data.map(r => ({
            id: r.id, // Request ID
            sponsor_id: r.sponsor_id,
            vehicleType: r.vehicle_type,
            name: r.name,
            model: r.model,
            price: r.price,
            year: r.year,
            image: r.image_url,
            image_url: r.image_url,
            // ...spread other fields if needed
            sponsors: r.sponsors
        }));
    }

    static async approveVehicle(requestId) {
        // 1. Get the request
        const { data: request, error: reqError } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (reqError) throw reqError;
        if (!request) throw new Error('Request not found');

        // 2. Prepare data for main table (ONLY use columns that exist in bikes/cars/scooty tables)
        const vehicleData = {
            name: request.name,
            price: request.price,
            image_url: request.image_url,
            sponsor_id: request.sponsor_id,
            is_approved: true,
            is_available: true
        };

        // Determine table
        let tableName;
        if (request.vehicle_type === 'bike') tableName = 'bikes';
        else if (request.vehicle_type === 'car') tableName = 'cars';
        else if (request.vehicle_type === 'scooty') tableName = 'scooty';
        else throw new Error('Invalid vehicle type');

        // 3. Insert into main table
        const { data: newVehicle, error: insertError } = await supabase
            .from(tableName)
            .insert([vehicleData])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting vehicle:', insertError);
            throw insertError;
        }

        // 4. Update request status
        await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        return newVehicle;
    }

    static async rejectVehicle(requestId) {
        const { error } = await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    }
    // ============================================
    // STATS OPERATIONS
    // ============================================

    static async getSponsorStats(sponsorId) {
        // 1. Get all vehicles for this sponsor
        const vehicles = await this.getSponsorVehicles(sponsorId);

        if (!vehicles || vehicles.length === 0) {
            return { totalRevenue: 0, totalBookings: 0, totalRideHours: 0 };
        }

        const vehicleIds = vehicles.map(v => v.id);
        const myVehicleMap = new Set(vehicles.map(v => `${v.id}-${v.type}`)); // e.g., "10-bike"

        // 2. Fetch all bookings involving these vehicle IDs
        // We select potential type columns to match correctly
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('vehicle_id, vehicle_type, total_amount, status, duration')
            .in('vehicle_id', vehicleIds);

        if (error) {
            console.error('Error fetching booking stats:', error);
            return { totalRevenue: 0, totalBookings: 0, totalRideHours: 0 };
        }

        let totalRevenue = 0;
        let totalBookings = 0;
        let totalRideHours = 0;

        // 3. Aggregate
        bookings.forEach(b => {
            // Determine booking booking vehicle type
            let bType = (b.vehicle_type || b.vehicleType || '').toLowerCase();
            if (bType === 'bikes') bType = 'bike';
            if (bType === 'cars') bType = 'car';

            // Construct key to match specific vehicle (ID + Type)
            const key = bType ? `${b.vehicle_id}-${bType}` : null;

            // Match condition
            if ((key && myVehicleMap.has(key)) || (!bType && vehicleIds.includes(b.vehicle_id))) {

                totalBookings++;

                // Calculate Duration
                let rideDuration = parseFloat(b.duration) || 0;
                // If ride is completed and has timestamps, use precise duration
                if (['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status)) {
                    if (b.ride_start_time && b.ride_end_time) {
                        const start = new Date(b.ride_start_time);
                        const end = new Date(b.ride_end_time);
                        const diffMs = end - start;
                        if (diffMs > 0) {
                            rideDuration = diffMs / (1000 * 60 * 60); // Hours with decimals
                        }
                    }
                }

                // Count Hours (Valid rides)
                if (!['cancelled', 'rejected', 'pending'].includes(b.status)) {
                    totalRideHours += rideDuration;
                }

                // Count Revenue (Completed/Ended only)
                if (['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status)) {
                    totalRevenue += (parseFloat(b.total_amount) || 0);
                }
            }
        });

        return { totalRevenue, totalBookings, totalRideHours };
    }

    static async getDetailedRevenueStats(sponsorId) {
        // 1. Get vehicles
        const vehicles = await this.getSponsorVehicles(sponsorId);
        if (!vehicles.length) return { gross: 0, transactions: [], vehicleStats: [] };

        // Map for vehicle stats using composite key "id-type"
        const vehicleMap = new Map();
        vehicles.forEach(v => {
            vehicleMap.set(`${v.id}-${v.type}`, {
                name: v.name,
                regNo: v.registration_number || v.bikeNumber,
                image: v.image_url || v.image,
                type: v.type, // Store type
                week: 0, month: 0, total: 0, hours: 0
            });
        });

        const vehicleIds = vehicles.map(v => v.id);

        // 2. Fetch bookings
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .in('vehicle_id', vehicleIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching revenue details:', error);
            return { gross: 0, transactions: [], vehicleStats: [] };
        }

        // 2.5 Fetch Withdrawals (Approved or Completed)
        const { data: withdrawals, error: wError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('sponsor_id', sponsorId)
            .in('status', ['approved', 'completed'])
            .order('created_at', { ascending: false });

        if (wError) {
            console.error('Error fetching withdrawals:', wError);
        }

        let grossRevenue = 0;
        const transactions = [];

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        bookings.forEach(b => {
            // Filter for Completed earnings
            if (!['completed', 'ride_completed', 'ride_ended', 'payment_success'].includes(b.status)) return;

            const amount = parseFloat(b.total_amount) || 0;
            const bookingDate = new Date(b.created_at || b.booking_date || now);

            // Normalize type using utility function
            const bType = normalizeVehicleType(b.vehicle_type || b.vehicleType);

            // Attempt to find vehicle stat
            let vStat = null;
            if (bType) {
                vStat = vehicleMap.get(`${b.vehicle_id}-${bType}`);
            } else {
                // Fallback: Try all types
                vStat = vehicleMap.get(`${b.vehicle_id}-bike`) ||
                    vehicleMap.get(`${b.vehicle_id}-car`) ||
                    vehicleMap.get(`${b.vehicle_id}-scooty`);
            }

            if (vStat) {
                // Calculate Duration
                let rideDuration = parseFloat(b.duration) || 0;
                if (b.ride_start_time && b.ride_end_time) {
                    const start = new Date(b.ride_start_time);
                    const end = new Date(b.ride_end_time);
                    const diffMs = end - start;
                    if (diffMs > 0) {
                        rideDuration = diffMs / (1000 * 60 * 60); // Hours with decimals
                    }
                }

                // Counts towards revenue
                grossRevenue += amount;
                vStat.total += amount;
                vStat.hours += rideDuration;

                if (bookingDate >= oneWeekAgo) vStat.week += amount;
                if (bookingDate >= oneMonthAgo) vStat.month += amount;

                // Add to Transaction Log
                transactions.push({
                    id: b.id,
                    booking_id: b.booking_id || b.id, // Ensure we have a display ID
                    date: bookingDate.toLocaleDateString(), // Keep for display if needed
                    raw_date: bookingDate.toISOString(), // For filtering
                    amount: amount,
                    type: 'Credit',
                    description: `Rent: ${vStat.name} (${vStat.regNo || b.vehicle_id})`,
                    vehicle_id: b.vehicle_id,
                    vehicle_name: vStat.name,
                    vehicle_image: vStat.image,
                    vehicle_reg: vStat.regNo,
                    hours: rideDuration
                });
            }
        });

        // Add Withdrawals to Transactions
        if (withdrawals && withdrawals.length > 0) {
            withdrawals.forEach(w => {
                const wDate = new Date(w.created_at);
                transactions.push({
                    id: w.id,
                    booking_id: `WTH-${w.id.toString().slice(0, 8)}`, // Shorten ID for display
                    date: wDate.toLocaleDateString(),
                    raw_date: wDate.toISOString(),
                    amount: parseFloat(w.amount),
                    type: 'Debit',
                    description: `Withdrawal (${w.status})`,
                    vehicle_id: null,
                    vehicle_name: w.payment_method === 'upi' ? `UPI: ${w.upi_id}` : 'Bank Transfer',
                    vehicle_image: null,
                    vehicle_reg: '-',
                    hours: 0
                });
            });
        }

        // Sort combined transactions by date descending
        transactions.sort((a, b) => new Date(b.raw_date) - new Date(a.raw_date));

        // Calculate All-Time Stats for Response (Required by Withdrawal Page)
        const totalEarnings = grossRevenue;
        const totalWithdrawn = withdrawals ? withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0) : 0;
        const commission = totalEarnings * 0.30;
        const netEarnings = totalEarnings - commission - totalWithdrawn;

        return {
            grossRevenue,
            netEarnings,
            totalWithdrawn,
            commission,
            transactions,
            vehicleStats: Array.from(vehicleMap.values())
        };
    }

    static async getAllVehiclesAdmin() {
        const [bikes, cars, scooty] = await Promise.all([
            supabase.from('bikes').select('*'),
            supabase.from('cars').select('*'),
            supabase.from('scooty').select('*')
        ]);

        const mapVehicle = (v, type) => ({
            id: v.id,
            name: v.name,
            registration_number: v.registration_number,
            image_url: v.image_url,
            sponsor_id: v.sponsor_id,
            type: type,
            price: v.price
        });

        return [
            ...(bikes.data || []).map(v => mapVehicle(v, 'bike')),
            ...(cars.data || []).map(v => mapVehicle(v, 'car')),
            ...(scooty.data || []).map(v => mapVehicle(v, 'scooty'))
        ];
    }

    static async getAllSponsorsAdmin() {
        const { data, error } = await supabase
            .from('sponsors')
            .select('id, full_name, email');

        if (error) {
            console.error('Error fetching sponsors:', error);
            return [];
        }
        return data;
    }

    static async assignVehicleToSponsor(vehicleId, type, sponsorId) {
        let tableName;
        if (type === 'bike') tableName = 'bikes';
        else if (type === 'car') tableName = 'cars';
        else if (type === 'scooty') tableName = 'scooty';
        else throw new Error('Invalid vehicle type');

        // Assign to sponsor AND verify it is active/approved
        const { error } = await supabase
            .from(tableName)
            .update({
                sponsor_id: sponsorId,
                is_available: true
            })
            .eq('id', vehicleId);

        if (error) throw error;
        return true;
    }

    static async getSponsorEarningsReport() {
        // 1. Fetch all sponsors
        const { data: sponsors, error: sponsorError } = await supabase
            .from('sponsors')
            .select('id, full_name, email');

        if (sponsorError) throw sponsorError;

        // 2. Fetch all vehicles to map ID -> Sponsor
        const [bikes, cars, scooty] = await Promise.all([
            supabase.from('bikes').select('id, sponsor_id'),
            supabase.from('cars').select('id, sponsor_id'),
            supabase.from('scooty').select('id, sponsor_id')
        ]);

        const vehicleOwnerMap = new Map(); // "id-type" -> sponsor_id

        const addToMap = (list, type) => {
            (list || []).forEach(v => {
                vehicleOwnerMap.set(`${v.id}-${type}`, v.sponsor_id);
            });
        };

        addToMap(bikes.data, 'bike');
        addToMap(cars.data, 'car');
        addToMap(scooty.data, 'scooty');

        // 3. Fetch all completed bookings (MUST match filter in getDetailedRevenueStats)
        const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('vehicle_id, vehicle_type, total_amount, status')
            .in('status', ['completed', 'ride_completed', 'ride_ended', 'payment_success']);

        if (bookingError) throw bookingError;

        // 4. Fetch all completed withdrawals
        const { data: withdrawals, error: withdrawalError } = await supabase
            .from('withdrawal_requests')
            .select('sponsor_id, amount')
            .eq('status', 'completed');

        if (withdrawalError) console.warn("Withdrawal table error:", withdrawalError);

        // --- Aggregation ---

        const sponsorStats = new Map();

        // Initialize sponsors
        sponsors.forEach(s => {
            sponsorStats.set(s.id, {
                id: s.id,
                name: s.full_name,
                email: s.email,
                revenue: 0,
                withdrawn: 0,
                bookings: 0,
                vehicleCount: 0 // Track vehicles
            });
        });

        // Initialize "Unassigned / RentHub"
        const UNASSIGNED_ID = 'unassigned';
        sponsorStats.set(UNASSIGNED_ID, {
            id: UNASSIGNED_ID,
            name: 'Unassigned / RentHub',
            email: '---',
            revenue: 0,
            withdrawn: 0,
            bookings: 0,
            vehicleCount: 0
        });

        // Count Vehicles
        for (const [key, ownerId] of vehicleOwnerMap.entries()) {
            let stats = sponsorStats.get(ownerId);
            if (!stats) stats = sponsorStats.get(UNASSIGNED_ID);
            stats.vehicleCount += 1;
        }

        // Process Bookings
        (bookings || []).forEach(b => {
            // Normalize type using utility function
            const vType = normalizeVehicleType(b.vehicle_type || b.vehicleType);

            // Lookup owner
            // Try exact match first
            let key = `${b.vehicle_id}-${vType}`;
            let sponsorId = vehicleOwnerMap.get(key);

            // Fallback: Try all types if not found (in case booking type is corrupted or missing)
            if (!sponsorId) {
                sponsorId = vehicleOwnerMap.get(`${b.vehicle_id}-bike`) ||
                    vehicleOwnerMap.get(`${b.vehicle_id}-car`) ||
                    vehicleOwnerMap.get(`${b.vehicle_id}-scooty`);
            }

            // If sponsor exists and is in our list
            let stats = sponsorStats.get(sponsorId);
            if (!stats) {
                stats = sponsorStats.get(UNASSIGNED_ID);
            }

            stats.revenue += (parseFloat(b.total_amount) || 0);
            stats.bookings += 1;
        });

        // Process Withdrawals
        (withdrawals || []).forEach(w => {
            const stats = sponsorStats.get(w.sponsor_id);
            if (stats) {
                stats.withdrawn += (parseFloat(w.amount) || 0);
            }
        });

        return Array.from(sponsorStats.values());
    }
}

module.exports = SponsorModel;

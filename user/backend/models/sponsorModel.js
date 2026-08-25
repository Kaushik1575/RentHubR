const supabase = require('../config/supabase');

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
        // vehicleData contains { list of fields including type, sponsor_id ... }
        const { sponsor_id, type } = vehicleData;

        const { data, error } = await supabase
            .from('sponsor_vehicle_requests')
            .insert([{
                sponsor_id: sponsor_id,
                vehicle_type: type,
                vehicle_details: vehicleData,
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

        // Fetch PENDING requests
        const { data: requests } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*')
            .eq('sponsor_id', sponsorId)
            .eq('status', 'pending');

        const liveVehicles = [
            ...(bikes.data || []).map(v => ({ ...v, type: 'bike', status: 'Approved' })),
            ...(cars.data || []).map(v => ({ ...v, type: 'car', status: 'Approved' })),
            ...(scooty.data || []).map(v => ({ ...v, type: 'scooty', status: 'Approved' }))
        ];

        const pendingVehicles = (requests || []).map(r => ({
            ...r.vehicle_details,
            id: r.id, // Use request ID for tracking
            status: 'Pending Approval'
        }));

        return [...liveVehicles, ...pendingVehicles];
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
            ...r.vehicle_details, // Spread the details (name, price, etc)
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

        // 2. Prepare data matching exact Supabase table schema
        const details = request.vehicle_details || {};
        const vehicleType = (request.vehicle_type || details.type || 'bike').toLowerCase();
        let tableName = 'bikes';
        if (vehicleType === 'car') tableName = 'cars';
        else if (vehicleType === 'scooty') tableName = 'scooty';

        const fullName = `${request.name || details.name || ''} ${request.model || details.model || ''}`.trim() || 'Vehicle';
        const vehicleData = {
            name: fullName,
            engine: details.engine || details.engine_cc || (vehicleType === 'car' ? '1200cc' : '150cc'),
            fuel_type: details.fuel_type || 'Petrol',
            price: parseFloat(details.pricing_terms?.proposed_price || request.price || details.price || 65),
            image_url: request.image_url || details.image_url || null,
            sponsor_id: request.sponsor_id,
            is_approved: true,
            is_available: true
        };

        if (tableName === 'bikes') {
            vehicleData.rc_url = request.rc_url || details.rc_url || null;
        }

        // 3. Insert into main table
        const { data: inserted, error: insertError } = await supabase
            .from(tableName)
            .insert([vehicleData])
            .select()
            .single();

        if (insertError) {
            console.error(`Error inserting into ${tableName}:`, insertError);
            throw insertError;
        }

        // 4. Update request status
        await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        return request;
    }

    static async rejectVehicle(requestId) {
        const { error } = await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    }

    static async updateRequestStage(requestId, stageNumber, stagePayload = {}) {
        const { data: request, error: reqError } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*, sponsors(*)')
            .eq('id', requestId)
            .single();

        if (reqError || !request) throw new Error('Request not found');

        const details = request.vehicle_details || {};
        const history = details.stage_history || [];
        const trackingId = details.tracking_id || `RH-REQ-${request.id}`;

        const stageNames = {
            1: 'SUBMITTED',
            2: 'DOC_REVIEW',
            3: 'PHYSICAL_SURVEY',
            4: 'SURVEY_REPORT',
            5: 'PRICE_DECISION',
            6: 'SPONSOR_AGREEMENT',
            7: 'CONTRACT_ACTIVATED',
            8: 'GPS_INSTALLATION',
            9: 'BIKE_LIVE'
        };

        const stageTitle = stageNames[stageNumber] || `STAGE_${stageNumber}`;
        history.push({
            stage: stageNumber,
            title: stageTitle,
            completed_at: new Date().toISOString(),
            notes: stagePayload.notes || `Advanced to Stage ${stageNumber}`
        });

        const updatedDetails = {
            ...details,
            ...stagePayload,
            tracking_id: trackingId,
            current_stage: stageNumber,
            stage_name: stageTitle,
            stage_history: history,
            survey_scheduled_date: stagePayload.survey_scheduled_date !== undefined ? stagePayload.survey_scheduled_date : details.survey_scheduled_date,
            survey_report: stagePayload.survey_report !== undefined ? stagePayload.survey_report : details.survey_report,
            pricing_terms: stagePayload.pricing_terms !== undefined ? stagePayload.pricing_terms : details.pricing_terms,
            gps_tracking: stagePayload.gps_tracking !== undefined ? stagePayload.gps_tracking : details.gps_tracking,
            agreement_accepted_at: stagePayload.agreement_accepted_at !== undefined ? stagePayload.agreement_accepted_at : details.agreement_accepted_at,
            terms_accepted: stagePayload.terms_accepted !== undefined ? stagePayload.terms_accepted : details.terms_accepted,
            terms_declined: stagePayload.terms_declined !== undefined ? stagePayload.terms_declined : details.terms_declined,
            counter_offer_price: stagePayload.counter_offer_price !== undefined ? stagePayload.counter_offer_price : details.counter_offer_price,
            sponsor_requested_price: stagePayload.sponsor_requested_price !== undefined ? stagePayload.sponsor_requested_price : details.sponsor_requested_price,
            sponsor_price_remarks: stagePayload.sponsor_price_remarks !== undefined ? stagePayload.sponsor_price_remarks : details.sponsor_price_remarks
        };

        let newStatus = request.status;
        if (stageNumber === 9) {
            newStatus = 'approved';
        } else if (stagePayload.status) {
            newStatus = stagePayload.status;
        }

        const { data: updatedReq, error: updateError } = await supabase
            .from('sponsor_vehicle_requests')
            .update({
                status: newStatus,
                vehicle_details: updatedDetails
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedReq;
    }
}

module.exports = SponsorModel;

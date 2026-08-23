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
        const { sponsor_id, type } = vehicleData;
        const trackingId = `RH-REQ-${Date.now().toString().slice(-4)}`;

        const stageHistory = [
            { stage: 1, title: 'Application Submitted', completed_at: new Date().toISOString(), notes: 'Bike & documents uploaded by sponsor' }
        ];

        const details = {
            ...vehicleData,
            tracking_id: trackingId,
            current_stage: 1,
            stage_name: 'SUBMITTED',
            stage_history: stageHistory,
            survey_report: null,
            pricing_terms: {
                proposed_price: vehicleData.price || 65,
                sponsor_percentage: 70,
                platform_percentage: 30
            },
            gps_tracking: null
        };

        const { data, error } = await supabase
            .from('sponsor_vehicle_requests')
            .insert([{
                sponsor_id: sponsor_id,
                vehicle_type: type || 'bike',
                name: vehicleData.name,
                registration_number: vehicleData.registration_number,
                model: vehicleData.model,
                year: vehicleData.year,
                price: vehicleData.price,
                image_url: vehicleData.image_url,
                rc_url: vehicleData.rc_url,
                insurance_url: vehicleData.insurance_url,
                puc_url: vehicleData.puc_url,
                status: 'pending',
                vehicle_details: details
            }])
            .select()
            .single();

        if (error) throw error;

        // Automatically trigger Step 1 Email to Sponsor
        try {
            const { data: sponsor } = await supabase.from('sponsors').select('*').eq('id', sponsor_id).single();
            if (sponsor && sponsor.email) {
                const { sendSponsorTimelineEmail } = require('../config/emailService');
                await sendSponsorTimelineEmail(sponsor.email, sponsor.full_name, {
                    ...data,
                    ...details,
                    tracking_id: trackingId
                }, 1);
            }
        } catch (e) {
            console.warn('Error sending initial timeline email:', e.message);
        }

        return { ...data, ...details, tracking_id: trackingId };
    }

    static async getSponsorVehicles(sponsorId) {
        // Fetch LIVE vehicles
        const [bikes, cars, scooty] = await Promise.all([
            supabase.from('bikes').select('*').eq('sponsor_id', sponsorId),
            supabase.from('cars').select('*').eq('sponsor_id', sponsorId),
            supabase.from('scooty').select('*').eq('sponsor_id', sponsorId)
        ]);

        // Fetch all requests (pending or in onboarding)
        const { data: requests } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*')
            .eq('sponsor_id', sponsorId)
            .neq('status', 'rejected')
            .order('created_at', { ascending: false });

        const liveVehicles = [
            ...(bikes.data || []).map(v => ({ ...v, type: 'bike', status: 'Approved', current_stage: 9 })),
            ...(cars.data || []).map(v => ({ ...v, type: 'car', status: 'Approved', current_stage: 9 })),
            ...(scooty.data || []).map(v => ({ ...v, type: 'scooty', status: 'Approved', current_stage: 9 }))
        ];

        const pendingVehicles = (requests || []).filter(r => r.status !== 'approved').map(r => {
            const details = r.vehicle_details || {};
            const trackingId = details.tracking_id || `RH-REQ-${r.id}`;
            const currentStage = details.current_stage || 1;
            return {
                ...details,
                id: r.id,
                name: r.name || details.name,
                model: r.model || details.model,
                registration_number: r.registration_number || details.registration_number,
                price: r.price || details.price,
                image: r.image_url || details.image_url,
                image_url: r.image_url || details.image_url,
                type: r.vehicle_type || details.type || 'bike',
                status: r.status || 'Pending Approval',
                tracking_id: trackingId,
                current_stage: currentStage,
                stage_history: details.stage_history || [],
                survey_report: details.survey_report || null,
                pricing_terms: details.pricing_terms || null,
                gps_tracking: details.gps_tracking || null
            };
        });

        return [...liveVehicles, ...pendingVehicles];
    }

    // ============================================
    // ADMIN OPERATIONS
    // ============================================

    static async getPendingVehicles() {
        const { data, error } = await supabase
            .from('sponsor_vehicle_requests')
            .select('*, sponsors(full_name, phone_number, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(r => {
            const details = r.vehicle_details || {};
            const trackingId = details.tracking_id || `RH-REQ-${r.id}`;
            const currentStage = details.current_stage || (r.status === 'approved' ? 9 : 1);
            return {
                id: r.id,
                sponsor_id: r.sponsor_id,
                vehicleType: r.vehicle_type,
                name: r.name || details.name,
                registration_number: r.registration_number || details.registration_number,
                model: r.model || details.model,
                year: r.year || details.year,
                price: r.price || details.price,
                image_url: r.image_url || details.image_url,
                rc_url: r.rc_url || details.rc_url,
                insurance_url: r.insurance_url || details.insurance_url,
                puc_url: r.puc_url || details.puc_url,
                status: r.status,
                tracking_id: trackingId,
                current_stage: currentStage,
                stage_history: details.stage_history || [],
                survey_report: details.survey_report || null,
                pricing_terms: details.pricing_terms || null,
                gps_tracking: details.gps_tracking || null,
                sponsors: r.sponsors
            };
        });
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
            tracking_id: trackingId,
            current_stage: stageNumber,
            stage_name: stageTitle,
            stage_history: history,
            survey_scheduled_date: stagePayload.survey_scheduled_date || details.survey_scheduled_date,
            survey_report: stagePayload.survey_report || details.survey_report,
            pricing_terms: stagePayload.pricing_terms || details.pricing_terms,
            gps_tracking: stagePayload.gps_tracking || details.gps_tracking,
            agreement_accepted_at: stagePayload.agreement_accepted_at || details.agreement_accepted_at
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

        // If Stage 9 (Bike Goes LIVE), push vehicle to the main table (bikes/cars/scooty)
        if (stageNumber === 9) {
            await SponsorModel.approveVehicle(requestId);
        }

        // Trigger Automated Email to Sponsor
        try {
            const sponsor = request.sponsors;
            if (sponsor && sponsor.email) {
                const { sendSponsorTimelineEmail } = require('../config/emailService');
                await sendSponsorTimelineEmail(sponsor.email, sponsor.full_name, {
                    ...request,
                    ...updatedDetails
                }, stageNumber);
            }
        } catch (e) {
            console.warn(`Error sending stage ${stageNumber} email:`, e.message);
        }

        return updatedReq;
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

        const details = request.vehicle_details || {};

        // 2. Prepare data for main table
        const vehicleData = {
            name: request.name || details.name,
            registration_number: request.registration_number || details.registration_number,
            model: request.model || details.model,
            year: request.year || details.year,
            price: details.pricing_terms?.proposed_price || request.price || details.price || 65,
            image_url: request.image_url || details.image_url,
            rc_url: request.rc_url || details.rc_url,
            insurance_url: request.insurance_url || details.insurance_url,
            puc_url: request.puc_url || details.puc_url,
            sponsor_id: request.sponsor_id,
            is_approved: true,
            is_available: true,
            type: request.vehicle_type || details.type || 'bike',
            engine: details.engine || '',
            fuel_type: details.fuel_type || '',
            description: details.description || ''
        };

        // Determine table
        let tableName;
        if (request.vehicle_type === 'bike') tableName = 'bikes';
        else if (request.vehicle_type === 'car') tableName = 'cars';
        else if (request.vehicle_type === 'scooty') tableName = 'scooty';
        else tableName = 'bikes';

        // 3. Insert into main table
        const { data: inserted, error: insertError } = await supabase
            .from(tableName)
            .insert([vehicleData])
            .select()
            .single();

        if (insertError) throw insertError;

        // 4. Update request status
        await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        return inserted;
    }

    static async rejectVehicle(requestId) {
        const { error } = await supabase
            .from('sponsor_vehicle_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    }
}

module.exports = SponsorModel;

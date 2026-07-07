const supabase = require('../config/supabase');

// Create withdrawal request (Sponsor)
const createWithdrawalRequest = async (req, res) => {
    try {
        const sponsorId = req.user.id;
        const { amount, paymentMethod, bankDetails, upiDetails } = req.body;

        console.log('💰 [CREATE] New withdrawal request from sponsor:', sponsorId);
        console.log('💰 [CREATE] Amount:', amount, 'Method:', paymentMethod);

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (!paymentMethod || !['bank', 'upi'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Validate payment details based on method
        if (paymentMethod === 'bank') {
            if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
                return res.status(400).json({ error: 'Bank details are incomplete' });
            }
        } else if (paymentMethod === 'upi') {
            if (!upiDetails || !upiDetails.upiId) {
                return res.status(400).json({ error: 'UPI ID is required' });
            }
        }

        // Check sponsor's available balance (you can implement this based on your revenue logic)
        // For now, we'll skip this check, but you should add it

        // Create withdrawal request
        const withdrawalData = {
            sponsor_id: sponsorId,
            amount: parseFloat(amount),
            payment_method: paymentMethod,
            status: 'pending'
        };

        if (paymentMethod === 'bank') {
            withdrawalData.bank_account_number = bankDetails.accountNumber;
            withdrawalData.ifsc_code = bankDetails.ifscCode;
            withdrawalData.account_holder_name = bankDetails.accountHolderName;
        } else {
            withdrawalData.upi_id = upiDetails.upiId;
        }

        console.log('💾 [CREATE] Inserting data:', withdrawalData);

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .insert([withdrawalData])
            .select()
            .single();

        if (error) {
            console.error('❌ [CREATE] Error creating withdrawal request:', error);
            return res.status(500).json({ error: 'Failed to create withdrawal request' });
        }

        console.log('✅ [CREATE] Withdrawal request created successfully:', data);

        res.status(201).json({
            message: 'Withdrawal request created successfully',
            request: data
        });
    } catch (error) {
        console.error('❌ [CREATE] Error in createWithdrawalRequest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get sponsor's withdrawal requests
const getMyWithdrawalRequests = async (req, res) => {
    try {
        const sponsorId = req.user.id;

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('sponsor_id', sponsorId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching withdrawal requests:', error);
            return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
        }

        res.json({ requests: data });
    } catch (error) {
        console.error('Error in getMyWithdrawalRequests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all withdrawal requests (Admin)
const getAllWithdrawalRequests = async (req, res) => {
    try {
        console.log('🔍 [BACKEND] Fetching all withdrawal requests...');
        const { status } = req.query;

        let query = supabase
            .from('withdrawal_requests')
            .select(`
                *,
                sponsors:sponsor_id (
                    id,
                    full_name,
                    email,
                    phone_number
                )
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ [BACKEND] Error fetching withdrawal requests:', error);
            return res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
        }

        console.log('✅ [BACKEND] Found withdrawal requests:', data?.length || 0);
        console.log('📊 [BACKEND] Requests data:', JSON.stringify(data, null, 2));
        res.json({ requests: data });
    } catch (error) {
        console.error('❌ [BACKEND] Error in getAllWithdrawalRequests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const { sendWithdrawalPaidEmail } = require('../config/sponsorEmailService');

// Update withdrawal request status (Admin)
const updateWithdrawalStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, adminNotes, transactionReference } = req.body;

        console.log(`🔄 [UPDATE] Request ${requestId} status change to: ${status}`);

        if (!['approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };

        if (adminNotes) {
            updateData.admin_notes = adminNotes;
        }

        if (transactionReference) {
            updateData.transaction_reference = transactionReference;
        }

        if (status === 'completed') {
            updateData.processed_at = new Date().toISOString();
            // You can add processed_by if you have admin authentication
        }

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .update(updateData)
            .eq('id', requestId)
            .select(`
                *,
                sponsors:sponsor_id (
                    id,
                    full_name,
                    email,
                    phone_number
                )
            `)
            .single();

        if (error) {
            console.error('Error updating withdrawal request:', error);
            return res.status(500).json({ error: 'Failed to update withdrawal request' });
        }

        // Send Email Notification if Completed (Paid)
        if (status === 'completed') {
            try {
                const sponsorEmail = data.sponsors?.email;
                const sponsorName = data.sponsors?.full_name || 'Partner';

                if (sponsorEmail) {
                    await sendWithdrawalPaidEmail(
                        sponsorEmail,
                        sponsorName,
                        {
                            amount: data.amount,
                            transactionReference: data.transaction_reference || transactionReference,
                            date: data.processed_at || new Date(),
                            paymentMethod: data.payment_method,
                            bankName: null
                        }
                    );
                    console.log(`📧 [EMAIL] Withdrawal confirmation sent to ${sponsorEmail}`);
                } else {
                    console.warn('⚠️ [EMAIL] Sponsor email not found, skipping notification');
                }
            } catch (emailErr) {
                console.error('❌ [EMAIL] Failed to send withdrawal email:', emailErr);
                // We do NOT block the response here, just log the error
            }
        }

        res.json({
            message: 'Withdrawal request updated successfully',
            request: data
        });
    } catch (error) {
        console.error('Error in updateWithdrawalStatus:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update sponsor bank details
const updateBankDetails = async (req, res) => {
    try {
        const sponsorId = req.user.id;
        const { bankAccountNumber, ifscCode, accountHolderName, upiId } = req.body;

        const updateData = {};

        if (bankAccountNumber) updateData.bank_account_number = bankAccountNumber;
        if (ifscCode) updateData.ifsc_code = ifscCode;
        if (accountHolderName) updateData.account_holder_name = accountHolderName;
        if (upiId) updateData.upi_id = upiId;

        const { data, error } = await supabase
            .from('sponsors')
            .update(updateData)
            .eq('id', sponsorId)
            .select()
            .single();

        if (error) {
            console.error('Error updating bank details:', error);
            return res.status(500).json({ error: 'Failed to update bank details' });
        }

        res.json({
            message: 'Bank details updated successfully',
            sponsor: data
        });
    } catch (error) {
        console.error('Error in updateBankDetails:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createWithdrawalRequest,
    getMyWithdrawalRequests,
    getAllWithdrawalRequests,
    updateWithdrawalStatus,
    updateBankDetails
};

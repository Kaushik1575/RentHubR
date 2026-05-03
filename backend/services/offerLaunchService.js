const supabase = require('../config/supabase');
const { sendNewOfferEmail } = require('../config/emailService');

const checkAndLaunchOffers = async () => {
    try {
        console.log('🔍 Checking for scheduled offers that need to launch...');
        const today = new Date().toISOString();

        // 1. Find active offers that have reached their launch time but haven't sent the launch email yet
        const { data: pendingOffers, error: fetchError } = await supabase
            .from('offers')
            .select('*')
            .eq('is_active', true)
            .eq('launch_email_sent', false)
            .lte('valid_from', today);

        if (fetchError) {
            if (fetchError.code === '42703') {
                console.error('❌ CRITICAL ERROR: Database column "launch_email_sent" is missing! Please run the SQL command provided.');
            } else {
                throw fetchError;
            }
            return;
        }

        if (!pendingOffers || pendingOffers.length === 0) {
            console.log('✅ No new offers to launch at this time.');
            return;
        }

        console.log(`🎯 Found ${pendingOffers.length} offers to launch!`);

        // 2. Fetch all users
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('email, full_name');

        if (userError) throw userError;
        if (!users || users.length === 0) return;

        for (const offer of pendingOffers) {
            console.log(`🚀 Launching offer: ${offer.title} (${offer.code})`);

            // Mark as sent IMMEDIATELY to prevent double sending if loop takes long
            await supabase
                .from('offers')
                .update({ launch_email_sent: true })
                .eq('id', offer.id);

            // Send emails with a small delay
            for (const user of users) {
                if (user.email) {
                    try {
                        // isUpdate = false because it's a new launch, but it will show as "Live" now
                        await sendNewOfferEmail(user.email, user.full_name, offer);
                        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                    } catch (emailErr) {
                        console.error(`Failed to send launch email to ${user.email}:`, emailErr);
                    }
                }
            }

            console.log(`✅ Launch broadcast complete for: ${offer.code}`);
        }

    } catch (err) {
        console.error('Error in checkAndLaunchOffers:', err);
    }
};

module.exports = { checkAndLaunchOffers };

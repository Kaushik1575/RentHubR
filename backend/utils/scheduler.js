const { checkAndSendReminders } = require('../services/reminderService');

const initScheduler = () => {
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

        console.log(`✅ Internal reminder scheduler active (checking every 5 minutes)`);
    } else {
        console.log('ℹ️  Internal cron disabled. Use external cron job to call /api/admin/cron/reminders?secret=...');
    }
};

module.exports = { initScheduler };

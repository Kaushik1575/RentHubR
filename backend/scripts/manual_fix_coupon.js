const supabase = require('../config/supabase');

async function manualFix() {
    const userId = 43;
    const rewardIdToMark = 1; // RH-YDKY46 (the older one)

    console.log(`Marking reward ${rewardIdToMark} as used for user ${userId}...`);

    const { data, error } = await supabase
        .from('rewards')
        .update({ is_used: true })
        .eq('id', rewardIdToMark)
        .eq('user_id', userId)
        .select();

    if (error) console.error(error);
    else console.log('Success:', data);
}

manualFix();

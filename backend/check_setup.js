const supabase = require('./config/supabase');

async function checkSetup() {
    console.log('🔍 Checking Mobile OTP Setup...\n');

    // Check if mobile_otps table exists
    const { data, error } = await supabase.from('mobile_otps').select('*').limit(1);

    if (error) {
        console.log('❌ mobile_otps table NOT found!');
        console.log('Error:', error.message);
        console.log('\n📋 Please run this SQL in Supabase:');
        console.log(`
create table public.mobile_otps (
  id uuid not null default gen_random_uuid (),
  phone_number text not null,
  otp text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  constraint mobile_otps_pkey primary key (id)
) tablespace pg_default;
        `);
    } else {
        console.log('✅ mobile_otps table exists!');
    }

    // Check Twilio config
    console.log('\n🔧 Twilio Configuration:');
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing');

    console.log('\n✨ Setup Check Complete!\n');
}

checkSetup();

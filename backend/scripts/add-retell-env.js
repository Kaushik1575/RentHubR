// Script to add Retell AI configuration to .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

// Retell AI configuration to add
const retellConfig = `
# Retell AI Configuration
RETELL_API_KEY=key_47254fd3407901e9678eb9f05504
RETELL_AGENT_ID=agent_1bafe9ca9c302f33c15826c22b
RETELL_FROM_NUMBER=+12173933886
`;

try {
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if Retell AI config already exists
    if (envContent.includes('RETELL_API_KEY')) {
        console.log('✅ Retell AI configuration already exists in .env file');
        console.log('If you need to update it, edit the .env file manually.');
    } else {
        // Append Retell AI configuration
        fs.appendFileSync(envPath, retellConfig, 'utf8');
        console.log('✅ Retell AI configuration added to .env file');
        console.log('\nAdded configuration:');
        console.log(retellConfig);
    }
} catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    console.log('\nPlease manually add the following to your .env file:');
    console.log(retellConfig);
}


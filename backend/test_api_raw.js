require('dotenv').config();
const axios = require('axios');

async function testRaw() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Testing Key:", key ? "Present" : "Missing");

    try {
        console.log("Fetching models via Raw REST API...");
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);

        console.log("\n✅ API Connection Successful!");
        console.log("Available Models:");
        response.data.models.forEach(m => {
            if (m.name.includes("gemini")) {
                console.log(` - ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            }
        });
    } catch (error) {
        console.error("\n❌ REST API Error:");
        if (error.response) {
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testRaw();

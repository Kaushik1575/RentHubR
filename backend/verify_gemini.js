require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return console.error("❌ No Key");

    const genAI = new GoogleGenerativeAI(key);

    // Test the model that we KNOW exists in REST API
    const models = ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-flash-latest"];

    for (const modelName of models) {
        console.log(`\nTesting SDK with: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName} responded: "${response.text().trim()}"`);
            return;
        } catch (error) {
            console.error(`❌ FAILED ${modelName}: ${error.message.split('\n')[0]}`);
        }
    }
}

testGemini();

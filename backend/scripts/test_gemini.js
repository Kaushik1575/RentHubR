const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function checkModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const models = [
        "gemini-1.5-flash", 
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-pro", 
        "gemini-1.0-pro", 
        "gemini-1.5-pro"
    ];
    
    console.log("Checking available models...");

    for (const modelName of models) {
        try {
             const model = genAI.getGenerativeModel({ model: modelName });
             const result = await model.generateContent("Test");
             console.log(`SUCCESS: ${modelName} is working.`);
             // We can stop after finding one, or list all working ones. Let's find one and exit.
             // But actually, finding the *best* one is better. 1.5 flash is preferred if available.
        } catch (e) {
             // simplify error message
             const msg = e.message.split('[404 Not Found]')[1] || e.message;
             console.log(`FAILED: ${modelName} - ${msg.trim().substring(0, 100)}...`);
        }
    }
}

checkModels();

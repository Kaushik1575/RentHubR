const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function verifyFix() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Extended list of models to try
    const modelsToTry = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-pro-vision"
    ];

    let success = false;
    let lastError;

    console.log("Starting verification of fallback logic...");
    console.log(`API Key present: ${!!process.env.GEMINI_API_KEY}`);

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting generation with: ${modelName}`);
            const currentModel = genAI.getGenerativeModel({ model: modelName });
            const result = await currentModel.generateContent("Hello");
            const response = await result.response;
            const text = response.text();

            console.log(`SUCCESS with ${modelName}`);
            console.log(`Response: ${text.substring(0, 50)}...`);
            success = true;
            break;
        } catch (e) {
            let msg = e.message;
            if (msg.includes("[404")) msg = "404 Not Found";
            else if (msg.includes("[403")) msg = "403 Forbidden";
            else if (msg.includes("[400")) msg = "400 Bad Request";

            console.log(`FAILED with ${modelName}: ${msg}`);
            lastError = e;
        }
    }

    if (!success) {
        console.error("VERIFICATION FAILED: All models failed.");
    } else {
        console.log("VERIFICATION SUCCESSFUL: A working model was found.");
    }
}

verifyFix();

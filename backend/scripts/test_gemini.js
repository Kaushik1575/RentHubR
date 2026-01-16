const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
        // For some reason listModels isn't directly exposed on the main class in some versions,
        // but let's try the model manager if available or just try a lighter call.
        // Actually, the easiest way to test access is to try a simple generateContent with a known safe model.

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Response from gemini-1.5-flash:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Response from gemini-pro:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }
}

listModels();

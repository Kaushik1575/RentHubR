const fetch = require('node-fetch');
require("dotenv").config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available generation models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(m.name);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

listModels();

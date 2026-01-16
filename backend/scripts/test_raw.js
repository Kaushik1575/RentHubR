const fetch = require('node-fetch');
require("dotenv").config();

async function rawTest() {
    const apiKey = process.env.GEMINI_API_KEY;
    const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

    for (const model of models) {
        console.log(`Testing ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const body = {
            contents: [{
                parts: [{ text: "Hello" }]
            }]
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            console.log(`Status for ${model}:`, response.status);
            if (response.status === 200) {
                console.log("SUCCESS!");
            } else {
                const text = await response.text();
                console.log("Error:", text.substring(0, 100)); // Print first 100 chars
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        }
        console.log("---");
    }
}

rawTest();

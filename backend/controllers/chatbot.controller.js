const { GoogleGenerativeAI } = require("@google/generative-ai");
const SupabaseDB = require('../models/supabaseDB');

// Helper to get formatted vehicle list text
async function getVehicleContext() {
    try {
        const bikes = await SupabaseDB.getVehicles('bikes');
        const cars = await SupabaseDB.getVehicles('cars');
        const scooty = await SupabaseDB.getVehicles('scooty');

        // Simplify lists to just critical info to save tokens
        const simplify = (list, type) => list.map(v => `${v.name} (${type}, ₹${v.price}/hr, ID:${v.id})`).join(', ');

        return `
Available Vehicles:
BIKES: ${simplify(bikes || [], 'bikes')}
CARS: ${simplify(cars || [], 'cars')}
SCOOTY: ${simplify(scooty || [], 'scooty')}
        `;
    } catch (e) {
        console.error("Error fetching vehicle context:", e);
        return "";
    }
}

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing");
            return res.status(500).json({ error: "Server configuration error: API Key missing" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Fetch real-time vehicle context
        const vehicleContext = await getVehicleContext();

        let formattedHistory = [];

        const systemPrompt = `You are the friendly and helpful AI assistant for RentHub.

${vehicleContext}

**GUIDELINES:**
1. **BE CONCISE**: Do not write long paragraphs. Keep it chatty.
2. **LISTING VEHICLES**:
   - If asked for recommendations (e.g., "Show me bikes"), list **EXACTLY 3** distinct options.
   - Include Name (**Bolded**) and Price/hr.
   - **Wait** for the user to choose one before asking for dates.

3. **BOOKING FLOW (STEP-BY-STEP)**:
   - Do NOT ask for Date, Time, and Duration all at once. It overwhelms the user.
   - **Step 1**: Confirm the Vehicle.
   - **Step 2**: Ask for the **Start Date**.
   - **Step 3**: Ask for the **Start Time** and **Duration**.
   - **Step 4**: Only when you have ALL details, generate the Booking Action.

4. **MANAGING EXISTING BOOKINGS (CRITICAL)**:
   - If the user provides a **Booking ID** (e.g., "RH...", "BK...", or a number) for tracking or status check, you **MUST** output the TRACK_BOOKING action immediately. Do not say you cannot do it.
   - If the user provides a **Booking ID** for cancellation, output the CANCEL_BOOKING action.
   - Example matches: "RH260116-045", "rh-1234", "101".
5. **USER REGISTRATION**:
   - If the user wants to register or signup and provides details (Name, Email, Phone), you **MUST** output the REGISTER_USER action.
   - If the user provides a password, include it in the action. If not, do NOT invent one.
   - If details are missing, ask for them specifically.
   - Example: "Register me: John, 9991234567, john@test.com, pass123" -> Output REGISTER_USER action.

**ACTIONS (Output ONLY the JSON block):**

**To Book:**
||| ACTION: BOOK_VEHICLE {"vehicleId": 123, "type": "bikes", "startDate": "YYYY-MM-DD", "startTime": "HH:MM", "duration": 5} |||

**To Track:**
||| ACTION: TRACK_BOOKING {"bookingId": "RH123456-789"} |||

**To Cancel:**
||| ACTION: CANCEL_BOOKING {"bookingId": "RH123456-789"} |||

**To Register:**
||| ACTION: REGISTER_USER {"fullName": "John Doe", "email": "john@example.com", "phoneNumber": "9876543210", "password": "optional_password"} |||

(TYPE must be 'bikes', 'cars', or 'scooty').
Do NOT wrap the output in markdown.`;

        formattedHistory.push({
            role: "user",
            parts: [{ text: systemPrompt }]
        });
        formattedHistory.push({
            role: "model",
            parts: [{ text: "Understood. I have the vehicle list and will follow the booking protocol." }]
        });

        if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-10);

            recentHistory.forEach(msg => {
                const role = msg.sender === 'user' ? 'user' : 'model';
                if (msg.text && msg.text.trim() !== "") {
                    formattedHistory.push({
                        role: role,
                        parts: [{ text: msg.text }]
                    });
                }
            });
        }

        // Try to use the latest model available in 2026
        // Based on available models list: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 400,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Reply:", text); // Debugging

        res.json({ reply: text });
    } catch (error) {
        console.error("Chatbot Error:", error.message);

        // Check for Quota Exceeded (429) or Not Found (404)
        if (error.message.includes("429") || error.message.includes("Quota")) {
            return res.status(429).json({ reply: "I'm currently experiencing very high traffic. Please ask me again in a minute!" });
        }

        if (error.message.includes("404")) {
            return res.status(404).json({ error: "AI Model not found or configuration error." });
        }

        res.status(500).json({ error: "Failed to process your request." });
    }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");
const SupabaseDB = require('../models/supabaseDB');
const axios = require('axios');
const { getWeatherOpenMeteo } = require('./weatherHelper');

// Helper to get formatted vehicle list text
async function getVehicleContext() {
    try {
        const bikes = await SupabaseDB.getVehicles('bikes');
        const cars = await SupabaseDB.getVehicles('cars');
        const scooty = await SupabaseDB.getVehicles('scooty');

        // Simplify lists with pricing and category
        const simplify = (list, type) => (list || []).map(v => `${v.name} (${type}, ₹${v.price}/hr, ID:${v.id})`).join(', ');

        return `
LIVE RENTHUB FLEET INVENTORY:
- BIKES: ${simplify(bikes, 'bikes')}
- CARS: ${simplify(cars, 'cars')}
- SCOOTY: ${simplify(scooty, 'scooty')}
        `;
    } catch (e) {
        console.error("Error fetching vehicle context:", e);
        return "";
    }
}

// Helper to get weather information for a location
const WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1/current.json?key=ffa3e13e30af45349e0164721252308";

const getWeatherDataForCity = async (city) => {
    try {
        const response = await axios.get(`${WEATHER_API_BASE_URL}&q=${encodeURIComponent(city)}&aqi=yes`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getWeatherDataForLocation = async (lat, lon) => {
    try {
        const response = await axios.get(`${WEATHER_API_BASE_URL}&q=${lat},${lon}&aqi=yes`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

async function getWeatherInfo(location) {
    try {
        let searchQuery = location.trim();
        const lowerLoc = searchQuery.toLowerCase();

        // Handle Aliases
        if (lowerLoc === 'jammu and kashmir' || lowerLoc === 'jammu kashmir' || lowerLoc === 'j&k' || lowerLoc === 'jk') {
            searchQuery = "Jammu City, Jammu and Kashmir";
        } else if (lowerLoc === 'odisha' || lowerLoc === 'orissa') {
            searchQuery = "Bhubaneswar, Odisha";
        }

        console.log(`🌤️ Weather Check for: ${searchQuery}`);

        let data;
        try {
            data = await getWeatherDataForCity(searchQuery);
        } catch (error) {
            if (!searchQuery.toLowerCase().includes("india")) {
                console.log("  - Exact match failed. Retrying with ', India'...");
                try {
                    data = await getWeatherDataForCity(`${searchQuery}, India`);
                } catch (retryError) {
                    console.error("  - Retry failed:", retryError.message);
                }
            }
        }

        if (data) {
            console.log("✅ Weather data fetched successfully");
            return {
                temp: Math.round(data.current.temp_c),
                feelsLike: Math.round(data.current.feelslike_c),
                condition: data.current.condition.text.toLowerCase(),
                description: data.current.condition.text.toLowerCase(),
                humidity: data.current.humidity,
                location: `${data.location.name}, ${data.location.region}, ${data.location.country}`
            };
        }

        console.log("  - Attempting Open-Meteo (Fallback)...");
        const openMeteoData = await getWeatherOpenMeteo(location);
        if (openMeteoData) {
            console.log("✅ Weather data fetched from Open-Meteo");
            return openMeteoData;
        }

        console.error("❌ All weather services failed");
        return null;

    } catch (error) {
        console.error("❌ Weather Info Error:", error.message);
        return null;
    }
}

// Helper to get weather-based recommendations
function getWeatherRecommendations(weatherInfo) {
    if (!weatherInfo) {
        return "I couldn't fetch the weather information. Please check the location name.";
    }

    const { temp, feelsLike, condition, description, humidity, location } = weatherInfo;

    let recommendations = `🌤️ **Weather in ${location}**: ${description}, ${temp}°C (feels like ${feelsLike}°C)\n\n`;
    recommendations += `📦 **What to pack for your ride:**\n`;

    if (temp > 30) {
        recommendations += `\n🔥 **Hot Weather Essentials:**\n`;
        recommendations += `• Sunscreen (SPF 30+)\n`;
        recommendations += `• Sunglasses & Cap/Hat\n`;
        recommendations += `• Water bottle (stay hydrated!)\n`;
        recommendations += `• Light, breathable clothing\n`;
        recommendations += `• Cooling towel\n`;
    } else if (temp < 15) {
        recommendations += `\n❄️ **Cold Weather Essentials:**\n`;
        recommendations += `• Warm jacket/windcheater\n`;
        recommendations += `• Gloves for riding\n`;
        recommendations += `• Scarf or neck warmer\n`;
        recommendations += `• Full-sleeve clothes\n`;
        recommendations += `• Thermal wear (if below 10°C)\n`;
    } else {
        recommendations += `\n🌡️ **Pleasant Weather:**\n`;
        recommendations += `• Light jacket (just in case)\n`;
        recommendations += `• Comfortable riding clothes\n`;
        recommendations += `• Sunglasses\n`;
    }

    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
        recommendations += `\n🌧️ **Rainy Weather Extras:**\n`;
        recommendations += `• Raincoat/Rain jacket (MUST)\n`;
        recommendations += `• Waterproof bag for belongings\n`;
        recommendations += `• Extra pair of socks\n`;
        recommendations += `• Waterproof phone cover\n`;
        recommendations += `• Anti-fog solution for helmet visor\n`;
        recommendations += `⚠️ **Ride carefully - roads may be slippery!**\n`;
    }

    if (condition.includes('snow')) {
        recommendations += `\n🌨️ **Snowy Conditions:**\n`;
        recommendations += `• Heavy winter jacket\n`;
        recommendations += `• Insulated gloves\n`;
        recommendations += `• Snow boots\n`;
        recommendations += `⚠️ **Consider postponing if roads are icy!**\n`;
    }

    if (humidity > 80) {
        recommendations += `\n💧 **High Humidity:**\n`;
        recommendations += `• Extra towel/handkerchief\n`;
        recommendations += `• Deodorant\n`;
    }

    recommendations += `\n✅ **Always Carry:**\n`;
    recommendations += `• Valid ID & Driving License\n`;
    recommendations += `• Phone & Charger\n`;
    recommendations += `• First-aid kit\n`;
    recommendations += `• Helmet (complimentary from RentHub)\n`;

    return recommendations;
}

// Helper to format issue details response
function formatIssueResponse(issue) {
    const statusConfig = {
        'Pending': { icon: '⏳', label: 'Pending Review' },
        'In Progress': { icon: '🔄', label: 'In Progress' },
        'Resolved': { icon: '✅', label: 'Resolved' },
        'Closed': { icon: '🔒', label: 'Closed' }
    };
    const sc = statusConfig[issue.status] || { icon: '📋', label: issue.status };
    const createdDate = issue.created_at ? new Date(issue.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    }) : '—';

    let reply = `🎫 **Support Issue Status [#${issue.issue_id}]**\n\n`;
    reply += `• **Status**: ${sc.icon} **${sc.label}**\n`;
    reply += `• **Category**: ${issue.category || 'General'}${issue.sub_category ? ` (${issue.sub_category})` : ''}\n`;
    if (issue.booking_id) {
        reply += `• **Related Booking**: #${issue.booking_id}\n`;
    }
    reply += `• **Reported On**: ${createdDate}\n`;
    reply += `• **Description**: ${issue.description}\n\n`;

    if (issue.admin_reply) {
        reply += `💬 **Admin Response / Resolution:**\n> ${issue.admin_reply}\n\n`;
    } else {
        reply += `ℹ️ **Support Update:**\n> Our team is actively reviewing your request. Most issues are addressed within 24 hours.\n\n`;
    }

    reply += `🔗 [Click here to view on full Issue Tracker](/track-issue?id=${issue.issue_id})`;
    return reply;
}

// Helper to extract Issue ID from user message
function extractIssueId(msg) {
    if (!msg || typeof msg !== 'string') return null;
    const trimmed = msg.trim();
    // 1. Explicit RH followed by 8+ digits
    const m1 = trimmed.match(/\b(RH\d{8,})\b/i);
    if (m1) return m1[1].toUpperCase();

    // 2. Just 10-15 digits
    if (/^\d{10,15}$/.test(trimmed)) {
        return 'RH' + trimmed;
    }

    // 3. User said "track issue ..." or "issue #..." or "track support ..."
    const m2 = trimmed.match(/(?:issue|ticket|support)\s*(?:id\s*)?[:#]?\s*([A-Za-z0-9_-]+)/i);
    if (m2) {
        let val = m2[1].toUpperCase().replace(/^#/, '');
        if (/^\d{8,}$/.test(val)) val = 'RH' + val;
        if (!val.includes('-')) return val;
    }
    return null;
}

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: "Message is required" });
        }

        // Direct handling for Support Issue Tracking
        const detectedIssueId = extractIssueId(message);
        const lowerMsg = message.toLowerCase().trim();
        const isExplicitIssueTrack = /^(🔍\s*)?track\s*(my\s*)?(support|issue|ticket|complaint)(\s*status)?$/i.test(lowerMsg) ||
                                     lowerMsg === "issue status" ||
                                     lowerMsg === "support status" ||
                                     lowerMsg === "track issue" ||
                                     lowerMsg === "track support" ||
                                     lowerMsg === "check support" ||
                                     lowerMsg === "check issue";

        if (isExplicitIssueTrack && !detectedIssueId) {
            return res.json({
                reply: "🎫 **Track Your Support Request**\n\nPlease enter your **Issue ID** (e.g., `RH1702456789012` or the number from your confirmation email) to check its live status and updates."
            });
        }

        const isDirectTrackQuery = detectedIssueId && (
            message.trim().toUpperCase() === detectedIssueId ||
            /^(track\s*(?:support|issue|ticket)?\s*[:#]?\s*)?RH\d{8,}$/i.test(message.trim()) ||
            /^\d{10,15}$/.test(message.trim()) ||
            message.trim().toLowerCase().startsWith("track issue") ||
            message.trim().toLowerCase().startsWith("track support") ||
            message.trim().toLowerCase().startsWith("issue status")
        );

        if (isDirectTrackQuery) {
            try {
                const issue = await SupabaseDB.getIssueById(detectedIssueId);
                if (issue) {
                    return res.json({ reply: formatIssueResponse(issue) });
                } else {
                    return res.json({
                        reply: `❌ **Issue Not Found**\n\nWe couldn't find any support request with ID **${detectedIssueId}**.\n\nPlease double-check the ID from your confirmation email or submit a new inquiry on our [Support Page](/support).`
                    });
                }
            } catch (err) {
                console.error("Error direct tracking issue in chatbot:", err);
            }
        }

        // Direct fast-path for "Tell me about RentHub" / "About RentHub" / Founder / History queries
        const isAboutIntent = /^(tell me about renthub|about renthub|about us|who (is|are) (the )?(owner|founder|ceo)|how many years|renthub history|who owns renthub)$/i.test(lowerMsg);
        if (isAboutIntent) {
            return res.json({
                reply: `🚗 **About RentHub — Smart Mobility, Delivered**\n\n` +
                       `**RentHub** is India's next-generation self-drive vehicle rental and fleet management platform, engineered for seamless urban commutes, weekend getaways, and scenic road trips.\n\n` +
                       `👑 **Founder & Leadership:**\n` +
                       `• **Kaushik Das** — Founder & CEO\n` +
                       `• **Jyoti Ranjan Sahoo** — Operation Manager\n` +
                       `• **Jyoti Swarup Parhi** — Head of Maintenance\n\n` +
                       `📅 **Our Journey & Experience:**\n` +
                       `• **Founded in 2024** (Over **2+ years of trusted operations**).\n` +
                       `• Started with just 10 bikes in Bhubaneswar, Odisha.\n` +
                       `• Today, RentHub has proudly powered **15,000+ verified customer trips** across a diverse fleet of motorcycles, scooters, and cars!\n\n` +
                       `📍 **Primary Hubs in Bhubaneswar, Odisha:**\n` +
                       `• Biju Patnaik International Airport (BBI)\n` +
                       `• Bhubaneswar Railway Station (Master Canteen)\n` +
                       `• KIIT University / Patia / Infocity Tech Corridor\n` +
                       `• Central Corridor: Plot 42, Aerocity Expressway\n\n` +
                       `🛡️ **Why Choose RentHub?**\n` +
                       `• **24/7 Operations** & Instant QR Code Vehicle Handshake\n` +
                       `• **Zero or Minimal Deposit** for KYC-verified riders\n` +
                       `• **Complimentary ISI Helmets** with every two-wheeler\n` +
                       `• **24/7 Voice AI Emergency SOS** with live GPS dispatch\n` +
                       `• **Fair & Transparent Tariffs** with 30% advance & remaining settled at pickup\n\n` +
                       `📞 **Need help?** Call our 24/7 desk at **+91 70777 33320** or WhatsApp us anytime!`
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing");
            return res.status(500).json({ error: "Server configuration error: API Key missing" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Fetch real-time vehicle context
        const vehicleContext = await getVehicleContext();

        // Fetch User Context (Coins) if authenticated
        let userContext = "";
        if (req.user && req.user.id) {
            try {
                const coins = await SupabaseDB.getUserCoins(req.user.id);
                userContext = `\n**LOGGED-IN USER STATUS:**\n- User ID: ${req.user.id}\n- Reward Points Balance: ${coins} Coins\n- Reward Redemption: ${coins >= 1000 ? "ELIGIBLE for a Free 2-Hour Ride coupon! (Redeem in Profile/Rewards)" : `Need ${1000 - coins} more points for a Free 2-Hour Ride`}\n`;
            } catch (e) {
                console.error("Error fetching user coins for chatbot:", e);
            }
        } else {
            userContext = `\n**USER CONTEXT:**\n- User is browsing as guest (not logged in). If they ask about their personal coins or profile, politely suggest logging in.`;
        }

        // Live Issue Context if an issue ID was detected in conversation
        let issueContext = "";
        if (detectedIssueId) {
            try {
                const liveIssue = await SupabaseDB.getIssueById(detectedIssueId);
                if (liveIssue) {
                    issueContext = `\n**LIVE SUPPORT ISSUE FOUND IN DATABASE:**\n- Issue ID: ${liveIssue.issue_id}\n- Status: ${liveIssue.status}\n- Category: ${liveIssue.category}${liveIssue.sub_category ? ` (${liveIssue.sub_category})` : ''}\n- Description: ${liveIssue.description}\n- Admin Reply / Resolution: ${liveIssue.admin_reply || "Under review by support team"}\n- Created At: ${liveIssue.created_at}\nAnswer with these live facts.`;
                }
            } catch (e) {
                console.error("Error fetching issue context for chatbot:", e);
            }
        }

        // Encyclopedic RentHub Knowledge Base
        const systemPrompt = `You are "RentHub AI", the official, highly professional, polite, and intelligent customer concierge for RentHub. You represent RentHub with complete authority and comprehensive domain knowledge.

===================================================================
1. ABOUT RENTHUB, STORY, FOUNDER & LEADERSHIP
===================================================================
• **What is RentHub?**: RentHub is India's next-generation self-drive vehicle rental and smart mobility platform, delivering flexible, transparent, and hassle-free hourly, daily, and weekly vehicle rentals.
• **Founder & Leadership**:
  - **Founder & CEO**: Kaushik Das — Founded RentHub with the visionary goal to democratize clean, accessible, and affordable self-drive transport across Odisha and India.
  - **Operation Manager**: Jyoti Ranjan Sahoo — Leads fleet logistics, vehicle allocation, hub operations, and customer experience.
  - **Head of Maintenance**: Jyoti Swarup Parhi — Directs multi-point safety inspections, vehicle servicing, and ISI helmet sanitization.
• **Company History & Experience**:
  - Founded in **2024** (**Over 2+ years of continuous trusted service**).
  - Started in 2024 with a modest fleet of just 10 bikes in Bhubaneswar.
  - Today, RentHub has proudly powered over **15,000+ verified customer trips** with a rapidly expanding fleet of premium bikes, scooters, and cars!
• **Mission & Core Values**:
  - **Mission**: Make quality mobility accessible to everyone with zero hidden charges, digital rental deeds, and contactless QR-code key handshakes.
  - **Sustainability**: Promoting eco-friendly, fuel-efficient scooters and electric vehicles.
  - **Quality**: Strict multi-point safety checks prior to every ride.
  - **Trust & Transparency**: Real-time fixed pricing, no surprise fees, and clear advance refund policies.
  - **Community**: Empowering a passionate community of daily commuters, students, and weekend adventure riders.
• **Operational Hubs & Stations (Bhubaneswar, Odisha)**:
  - **Airport Corridor**: Biju Patnaik International Airport (BBI) pickup point.
  - **Railway Station Hub**: Bhubaneswar Master Canteen Railway Station zone.
  - **Tech & Education Zone**: KIIT University, Patia, Infocity, and Silicon Institute hubs.
  - **Central Office / Corridor**: Plot 42, Aerocity Expressway, Bhubaneswar, Odisha.
• **Hours of Operation**:
  - **24/7 Operations**: Vehicle booking, contactless pickups, vehicle drop-offs, and customer support are active 24 hours a day, 7 days a week, 365 days a year!

We provide hourly, daily, and weekly self-drive rentals for:
- Motorcycles & Superbikes (Royal Enfield, Yamaha, KTM, Bajaj Pulsar, Apache RTR, Honda Hornet)
- Scooters (Honda Activa, TVS Jupiter, Suzuki Access, Yamaha Fascino)
- Cars (Hatchbacks, Sedans, Compact SUVs: Swift Dzire, Honda City, Mahindra Thar, Hyundai Creta, Tata Nexon)

===================================================================
2. LIVE FLEET & PRICING
===================================================================
${vehicleContext}

- **Pricing Structure**: All tariffs are priced per hour with transparent flat rates and zero hidden charges.
- **Advance Payment Policy**: To confirm a reservation, customers pay an advance of 30% (or min ₹100) online. The remaining 70% balance is settled upon physical vehicle pickup or return.
- **Accepted Payment Modes**: All payments are securely processed via Razorpay:
  • UPI (Google Pay, PhonePe, Paytm, BHIM, CRED)
  • Credit & Debit Cards (Visa, MasterCard, RuPay, Maestro)
  • NetBanking across all major Indian banks

===================================================================
3. RENTAL POLICIES & TERMS OF SERVICE (OFFICIAL)
===================================================================
• **Age Requirement**: Minimum 18 years old.
• **Required Documents (KYC)**:
  1. Valid Government-approved Driving License (Original or DigiLocker):
     - MCWG (Motorcycle with Gear) for geared bikes
     - MCWOG (Motorcycle without Gear) for scooters/scooty
     - LMV (Light Motor Vehicle) for cars
  2. Valid Identity & Address Proof: Aadhaar Card, Passport, or Voter ID.
• **Security Deposit**:
  - RentHub offers ZERO or minimal refundable security deposit for KYC-verified users.
• **Cancellation & Refund Policy**:
  - Cancellation more than 2 hours prior to scheduled start time: 100% Full Refund of the advance payment.
  - Cancellation within 2 hours of scheduled start time: 30% deduction of advance; remaining 70% refunded.
  - "No Show" (Rider Not Come without cancellation): Advance payment is non-refundable.
  - Refund Processing: Automated refunds are credited back to original payment method (Razorpay) or transferred directly to user's UPI/Bank account within 3–5 business days.
• **Fuel Policy**:
  - Fair "Same-to-Same" fuel policy: The vehicle is handed over with a noted fuel level and must be returned with the equivalent fuel level. If returned with less fuel, fuel charges apply.
• **Complimentary Helmets & Safety Gear**:
  - Clean, ISI-certified safety helmets are provided completely free with every two-wheeler rental. An extra pillion helmet is available upon request.
• **Late Returns & Overdue Charges**:
  - RentHub provides a 15-minute grace period.
  - Delays beyond the grace period incur standard hourly rate plus nominal overtime fee, calculated automatically upon QR return scan.
  - Riders can easily request trip extensions online before the scheduled return time.
• **Traffic Fines & Damages**:
  - The renter is responsible for traffic violations (challans) during their rental period.
  - Standard insurance covers accidental damage subject to company policy and non-negligence.

===================================================================
4. SAFETY & 24/7 EMERGENCY SOS SYSTEM
===================================================================
- RentHub features a built-in 24/7 Emergency SOS button on every active booking.
- In case of accident, medical emergency, or breakdown:
  1. Rider or Admin clicks "SOS" in their portal.
  2. The system immediately dispatches emergency SMS alerts with live GPS coordinates via Twilio.
  3. The system initiates automated voice calls via Retell AI to the emergency response unit and local authorities.

===================================================================
5. LOYALTY PROGRAM & REWARDS
===================================================================
${userContext}
- **RentHub Coins**: Users earn loyalty reward coins on every completed rental journey.
- **Scratch Cards**: Digital scratch cards with bonus coins and tariff discounts are unlocked upon milestone bookings.
- **Referral Program**: Users get a personal Referral Code in their Profile. Share it with friends to earn bonus coins when they complete their first ride.
- **Redemption**: Reaching 1,000 Coins allows users to redeem a "Free 2-Hour Ride" coupon code!

===================================================================
6. SPONSOR / FLEET OWNER PARTNER PROGRAM
===================================================================
- Vehicle owners and fleet investors can partner with RentHub to list idle bikes, scooters, and cars and earn passive income.
- **Revenue Distribution**: Lucrative 70/30 split (70% net revenue to vehicle owner, 30% platform management).
- **Sponsor Portal**: Features live vehicle telemetry, trip logs, earnings breakdown, and 1-click withdrawal requests.

===================================================================
7. CUSTOMER SUPPORT & CONTACT DETAILS
===================================================================
• **24/7 Helpline Phone**: +91 70777 33320 / +91 9090598756
• **WhatsApp Assistance**: +91 70777 33320 (Direct chat for quick support)
• **Official Inquiries Email**: support@renthub.in
• **Central Corridor & Hub**: Plot 42, Aerocity Expressway, Bhubaneswar, Odisha, India
• **Support Portal**: E-Query ticket desk on the website (`/e-query`) & in-app Support page (`/support`)
• **Live Issue Tracker**: Easily check support issue status on `/track-issue` or directly in this chat via "Track Support"
• **24/7 Roadside Voice AI SOS ('Aarohi')**: 1-click emergency dispatch via `/sos-activate`
• **Digital Handshake**: Contactless QR code scanning for vehicle handoff at pickup and return.
${issueContext}

===================================================================
8. INTERACTIVE ACTION TRIGGERS (CRITICAL)
===================================================================
When the user's intent clearly matches an action, append the exact action token at the end of your message:

1. **To Book a Vehicle**:
   When you have collected vehicle details, date, time, and duration:
   ||| ACTION: BOOK_VEHICLE {"vehicleId": 123, "type": "bikes", "startDate": "YYYY-MM-DD", "startTime": "HH:MM", "duration": 5} |||

2. **To Track a Booking**:
   When user provides Booking ID (e.g., "RH260116-045", "rh-1234", "101"):
   ||| ACTION: TRACK_BOOKING {"bookingId": "RH123456-789"} |||

3. **To Cancel a Booking**:
   When user asks to cancel and provides Booking ID:
   ||| ACTION: CANCEL_BOOKING {"bookingId": "RH123456-789"} |||

4. **To Register an Account**:
   When user asks to sign up / create account and provides details:
   ||| ACTION: REGISTER_USER {"fullName": "John Doe", "email": "john@example.com", "phoneNumber": "9876543210", "password": "optional_password"} |||

5. **To Check Weather & Packing**:
   When user asks about weather or packing recommendations for a city:
   ||| ACTION: CHECK_WEATHER {"location": "Bhubaneswar"} |||

6. **To Call Human Support**:
   When user asks for customer care phone number or human representative:
   ||| ACTION: CALL_SUPPORT {"number": "+919090598756"} |||

7. **To Track a Support Issue / Ticket**:
   When user asks to track a support issue or ticket and provides an Issue ID:
   ||| ACTION: TRACK_ISSUE {"issueId": "RH1702456789012"} |||

(Note: TYPE must be 'bikes', 'cars', or 'scooty'. Do NOT wrap the action token inside markdown code blocks).

===================================================================
9. CONVERSATIONAL STYLE & ETIQUETTE
===================================================================
- **Expert & Authoritative**: You know EVERYTHING about RentHub. Answer any question about policies, pricing, vehicles, bookings, refunds, safety, or sponsors thoroughly and accurately.
- **Professional & Courteous**: Maintain a warm, welcoming, polite, and executive SaaS tone.
- **Structured Formatting**: Use bold section titles, bullet points, numbered steps, and relevant emojis (🚗, 🛵, 💳, 📜, 🛡️, ⏰) to make your answers easy to scan and pleasant to read.
- **Booking Flow**: When a user wants to book, guide them systematically:
  Step 1: Confirm desired vehicle model.
  Step 2: Ask for the start date.
  Step 3: Ask for pickup time (AM/PM) and trip duration in hours.
  Step 4: Output the BOOK_VEHICLE action token.
`;

        let formattedHistory = [];
        formattedHistory.push({
            role: "user",
            parts: [{ text: systemPrompt }]
        });
        formattedHistory.push({
            role: "model",
            parts: [{ text: "Understood! I am RentHub AI, equipped with complete, official domain knowledge about RentHub. I am ready to assist customers with supreme professionalism, accuracy, and interactive actions." }]
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

        // Prioritized list of active Gemini models (supports environment override)
        const configuredModel = process.env.GEMINI_MODEL;
        const modelsToTry = [
            ...(configuredModel ? [configuredModel] : []),
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        let text = null;
        let success = false;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Attempting RentHub AI generation with: ${modelName}`);
                const currentModel = genAI.getGenerativeModel({ model: modelName });
                const currentChat = currentModel.startChat({
                    history: formattedHistory,
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.7,
                    },
                });

                const result = await currentChat.sendMessage(message);
                const response = await result.response;
                text = response.text();

                console.log(`✅ RentHub AI SUCCESS with: ${modelName}`);
                success = true;
                break;
            } catch (e) {
                console.warn(`⚠️ Failed with ${modelName}: ${e.message}`);
                lastError = e;
            }
        }

        if (!success || !text) {
            throw lastError || new Error("All Gemini models failed to generate response.");
        }

        res.json({ reply: text });
    } catch (error) {
        console.error("Chatbot Error:", error.message);

        if (error.message.includes("429") || error.message.includes("Quota")) {
            return res.status(429).json({ reply: "I am currently experiencing very high inquiry volume. Please ask me again in just a moment!" });
        }

        if (error.message.includes("404")) {
            return res.status(503).json({ error: "AI Service Temporarily Unavailable: Model routing update in progress." });
        }

        res.status(500).json({ error: "Failed to process your request." });
    }
};

// Weather check endpoint
exports.checkWeather = async (req, res) => {
    try {
        const { location } = req.body;

        if (!location) {
            return res.status(400).json({ error: "Location is required" });
        }

        const weatherInfo = await getWeatherInfo(location);

        if (!weatherInfo) {
            const fallbackResponse = `I'm having trouble connecting to the live weather radar right now, but here are **essential travel packing tips for ${location}**:

📦 **Smart Rider Packing Checklist:**

🌡️ **For Any Weather:**
• Light windcheater or riding jacket
• Comfortable riding attire & sturdy footwear
• UV sunglasses & sunscreen
• Water bottle (stay hydrated)

🌧️ **Rain Protection (Recommended):**
• Raincoat or waterproof poncho
• Waterproof pouch for mobile & wallet
• Spare pair of dry socks

✅ **Mandatory Documents:**
• Original Government Driving License & Aadhaar Card
• Mobile with RentHub booking confirmation QR code
• Helmets (complimentary provided by RentHub)

💡 **Pro Tip:** Check the local forecast before heading out for the best road conditions!`;

            return res.json({ reply: fallbackResponse });
        }

        const recommendations = getWeatherRecommendations(weatherInfo);
        res.json({ reply: recommendations });

    } catch (error) {
        console.error("Weather Check Error:", error.message);
        res.status(500).json({ error: "Failed to fetch weather information." });
    }
};

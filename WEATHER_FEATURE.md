# Weather & Packing Suggestions Feature 🌤️

## Overview
The chatbot now includes a smart weather checking feature that provides real-time weather information and personalized packing recommendations based on your destination's weather conditions.

## Setup Instructions

### 1. Get Your OpenWeatherMap API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Copy your API key

### 2. Add API Key to Environment Variables
Open your `backend/.env` file and add:
```
OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Restart Backend Server
After adding the API key, restart your backend server:
```bash
cd backend
npm start
```

## How to Use

### Option 1: Through Chatbot Menu
1. Open the chatbot
2. Click on **"Weather & Packing Tips"**
3. Enter your destination location (e.g., "Mumbai", "Goa", "Delhi")
4. Get instant weather info and packing suggestions!

### Option 2: Direct Query
Simply ask the chatbot:
- "What's the weather in Mumbai?"
- "What should I pack for Goa?"
- "Check weather for Delhi"
- "Weather in Bangalore"

## Features

### Weather Information
- Current temperature (°C)
- "Feels like" temperature
- Weather condition (sunny, rainy, cloudy, etc.)
- Humidity levels

### Smart Packing Recommendations

#### Hot Weather (>30°C)
- Sunscreen (SPF 30+)
- Sunglasses & Cap/Hat
- Water bottle
- Light, breathable clothing
- Cooling towel

#### Cold Weather (<15°C)
- Warm jacket/windcheater
- Gloves for riding
- Scarf or neck warmer
- Full-sleeve clothes
- Thermal wear (if below 10°C)

#### Rainy Weather
- Raincoat/Rain jacket (MUST)
- Waterproof bag for belongings
- Extra pair of socks
- Waterproof phone cover
- Anti-fog solution for helmet visor
- Safety warning about slippery roads

#### High Humidity (>80%)
- Extra towel/handkerchief
- Deodorant

### Always Recommended
- Valid ID & Driving License
- Phone & Charger
- First-aid kit
- Helmet (provided by RentHub)

## Technical Details

### Backend
- **Endpoint**: `POST /api/chatbot/weather`
- **Controller**: `chatbot.controller.js`
- **Weather API**: OpenWeatherMap API
- **Temperature Unit**: Celsius (metric)

### Frontend
- **Component**: `Chatbot.jsx`
- **Action**: `CHECK_WEATHER`
- **Response**: Formatted markdown with emojis

## Example Conversation

**User**: "Weather & Packing Tips"

**Bot**: "I can help you check the weather and suggest what to pack! 🌤️

Please tell me your **destination location** (e.g., Mumbai, Goa, Delhi)."

**User**: "Mumbai"

**Bot**: "🌤️ **Weather in Mumbai**: clear sky, 28°C (feels like 30°C)

📦 **What to pack for your ride:**

🌡️ **Pleasant Weather:**
• Light jacket (just in case)
• Comfortable riding clothes
• Sunglasses

✅ **Always Carry:**
• Valid ID & Driving License
• Phone & Charger
• First-aid kit
• Helmet (provided by RentHub)"

## Error Handling
- If location is not found, user gets a helpful error message
- If API key is missing, graceful fallback message
- Network errors are handled with retry suggestions

## Notes
- Weather data updates in real-time
- Free tier of OpenWeatherMap allows 1000 calls/day
- Temperature is displayed in Celsius
- Recommendations are context-aware based on multiple weather factors

---

**Need help?** Ask the chatbot or contact RentHub support!

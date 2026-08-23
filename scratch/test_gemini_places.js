const fetch = globalThis.fetch;

async function testGeminiNearbyPlaces(lat, lon, address = null) {
    const apiKey = "AIzaSyBoqUSP4uY0LQ1305pOWcAeRXAmglbAXg8";
    console.log(`Testing Gemini AI Real Places Discovery for: ${lat}, ${lon}`);

    const prompt = `You are a real-time geographic search assistant for RentHub roadside assistance.
The customer is located at Latitude: ${lat}, Longitude: ${lon} (Area/Address: ${address || 'Local area'}).

Identify the 3-4 REAL, ACTUAL operational Petrol Pumps / Fuel Stations and 3-4 REAL Two-Wheeler / Bike Mechanic Garages that are located in this specific area in India.
Provide their real business names, accurate street/highway address, and estimated distance in km from ${lat}, ${lon}.

Return ONLY valid JSON with this format:
{
  "garages": [
    {
      "name": "Real Garage Name",
      "address": "Actual Street/Highway",
      "distanceKm": 0.8,
      "distanceText": "800 meters away",
      "phone": "+91 98610 12345"
    }
  ],
  "petrolPumps": [
    {
      "name": "Real Petrol Pump Name (e.g. Indian Oil / Bharat Petroleum / HP)",
      "address": "Actual Street/Highway",
      "distanceKm": 0.6,
      "distanceText": "600 meters away",
      "phone": "1800-233-3555"
    }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!res.ok) {
        console.error('Gemini error:', res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
}

testGeminiNearbyPlaces(20.2185, 85.7358, "GITA Autonomous College, Madanpur, Janla, Bhubaneswar").catch(console.error);

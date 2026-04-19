// utils/geminiService.js
const { GoogleGenAI } = require("@google/genai");
const { fetchWeatherGrid } = require("./weather");
const { fetchPollutionGrid } = require("./pollution");
const Event = require("../models/Event");

// Initialize Gemini AI
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Safe JSON parser
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

/**
 * Fetch all events irrespective of location
 * @returns {Promise<Array>} Array of all approved events
 */
async function fetchAllEvents() {
  try {
    const events = await Event.find({
      status: "pending" // Only pending events
    }).sort({ start_at: 1 });

    return events;
  } catch (err) {
    console.error("❌ Error fetching events:", err.message);
    return [];
  }
}

/**
 * Aggregate all urban data (pollution, weather, events)
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @returns {Promise<Object>} Aggregated urban data
 */
async function aggregateUrbanData(lat, lon) {
  try {
    console.log("🔄 Aggregating urban data...");

    // Fetch all data in parallel
    const [weatherData, pollutionData, eventsData] = await Promise.all([
      fetchWeatherGrid(lat, lon),
      fetchPollutionGrid(),
      fetchAllEvents()
    ]);

    // Calculate averages for weather
    const avgWeather = {
      temperature: (weatherData.reduce((sum, w) => sum + w.main.temp, 0) / weatherData.length).toFixed(1),
      feels_like: (weatherData.reduce((sum, w) => sum + w.main.feels_like, 0) / weatherData.length).toFixed(1),
      humidity: (weatherData.reduce((sum, w) => sum + w.main.humidity, 0) / weatherData.length).toFixed(1),
      pressure: (weatherData.reduce((sum, w) => sum + w.main.pressure, 0) / weatherData.length).toFixed(0),
      windSpeed: (weatherData.reduce((sum, w) => sum + w.wind.speed, 0) / weatherData.length).toFixed(1),
      conditions: [...new Set(weatherData.map(w => w.condition.main))],
      description: weatherData[0]?.condition.description || "Unknown"
    };

    // Calculate averages for pollution
    const avgPollution = {
      avgAQI: (pollutionData.reduce((sum, p) => sum + p.aqi, 0) / pollutionData.length).toFixed(1),
      maxAQI: Math.max(...pollutionData.map(p => p.aqi)),
      minAQI: Math.min(...pollutionData.map(p => p.aqi)),
      avgComponents: {
        co: (pollutionData.reduce((sum, p) => sum + p.components.co, 0) / pollutionData.length).toFixed(2),
        no2: (pollutionData.reduce((sum, p) => sum + p.components.no2, 0) / pollutionData.length).toFixed(2),
        o3: (pollutionData.reduce((sum, p) => sum + p.components.o3, 0) / pollutionData.length).toFixed(2),
        pm2_5: (pollutionData.reduce((sum, p) => sum + p.components.pm2_5, 0) / pollutionData.length).toFixed(2),
        pm10: (pollutionData.reduce((sum, p) => sum + p.components.pm10, 0) / pollutionData.length).toFixed(2),
        so2: (pollutionData.reduce((sum, p) => sum + p.components.so2, 0) / pollutionData.length).toFixed(2)
      }
    };

    // Format events
    const formattedEvents = eventsData.map(event => ({
      name: event.name,
      description: event.description,
      category: event.category,
      organiser: event.organiser,
      location: event.location_name,
      startDate: event.start_at,
      endDate: event.end_at,
      coordinates: event.location.coordinates
    }));

    console.log(`📊 Aggregated Data: Weather from ${weatherData.length} points, Pollution from ${pollutionData.length} points, ${formattedEvents.length} events`);

    const aggregatedData = {
      location: { latitude: lat, longitude: lon },
      timestamp: new Date().toISOString(),
      weather: avgWeather,
      pollution: avgPollution,
      events: formattedEvents,
      eventCount: formattedEvents.length
    };

    return aggregatedData;
  } catch (err) {
    console.error("❌ Error aggregating urban data:", err.message);
    throw err;
  }
}

/**
 * Query Gemini AI with urban data context
 * @param {string} question - User's question
 * @param {Object} urbanData - Aggregated urban data from aggregateUrbanData()
 * @returns {Promise<string>} AI response
 */
async function queryWithContext(question, urbanData) {
  try {
    // Build the context prompt with strict instructions
    const contextPrompt = `You are an urban intelligence assistant. Answer ONLY the user's question directly and concisely using the provided data. Do NOT include unnecessary information or explanations.
    
CURRENT URBAN DATA:
Location: Latitude ${urbanData.location.latitude}, Longitude ${urbanData.location.longitude}
Timestamp: ${urbanData.timestamp}

WEATHER CONDITIONS:
- Temperature: ${urbanData.weather.temperature}°C (feels like ${urbanData.weather.feels_like}°C)
- Humidity: ${urbanData.weather.humidity}%
- Pressure: ${urbanData.weather.pressure} hPa
- Wind Speed: ${urbanData.weather.windSpeed} m/s
- Conditions: ${urbanData.weather.conditions.join(", ")}
- Description: ${urbanData.weather.description}

AIR QUALITY & POLLUTION:
- Average AQI: ${urbanData.pollution.avgAQI} (Range: ${urbanData.pollution.minAQI} - ${urbanData.pollution.maxAQI})
- PM2.5: ${urbanData.pollution.avgComponents.pm2_5} µg/m³
- PM10: ${urbanData.pollution.avgComponents.pm10} µg/m³
- NO2: ${urbanData.pollution.avgComponents.no2} µg/m³
- O3: ${urbanData.pollution.avgComponents.o3} µg/m³
- CO: ${urbanData.pollution.avgComponents.co} µg/m³
- SO2: ${urbanData.pollution.avgComponents.so2} µg/m³

ALL EVENTS (${urbanData.eventCount} total):
${urbanData.events.length > 0 
  ? urbanData.events.map((e, i) => `
${i + 1}. ${e.name}
   Category: ${e.category}
   Description: ${e.description}
   Organiser: ${e.organiser}
   Location: ${e.location}
   Start: ${new Date(e.startDate).toLocaleString()}
   End: ${new Date(e.endDate).toLocaleString()}
`).join("")
  : "No events available."}

USER QUESTION: ${question}

IMPORTANT: Answer ONLY the question asked. Be direct and concise. Do not add extra information or explanations unless necessary.`;

    console.log("🤖 Sending query to Gemini AI...");

    const res = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt
    });

    // Handle response - extract text from different possible structures
    let text;
    
    if (typeof res.text === 'function') {
      // If text is a method, call it
      text = res.text();
    } else if (res.candidates && res.candidates[0] && res.candidates[0].content && res.candidates[0].content.parts) {
      // If response has candidates structure, extract text from parts
      text = res.candidates[0].content.parts.map(p => p.text).join('');
    } else if (typeof res === 'string') {
      // If response is directly a string
      text = res;
    } else {
      // Fallback - try to extract any text-like content
      console.warn("⚠️ Unexpected response structure:", res);
      text = "Unable to process AI response. Please try again.";
    }

    return text;
  } catch (err) {
    console.error("❌ Error querying Gemini AI:", err.message);
    console.error("Stack:", err.stack);
    throw err;
  }
}

/**
 * Main function: Process question with urban data
 * @param {string} question - User's question
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @returns {Promise<Object>} Response object with AI answer and data
 */
async function askAboutCity(question, lat = 16.5062, lon = 80.6480) {
  try {
    console.log("📍 Processing query for location:", { lat, lon });
    console.log("❓ Question:", question);

    // Aggregate urban data
    const urbanData = await aggregateUrbanData(lat, lon);

    // Query Gemini AI with context
    const aiResponse = await queryWithContext(question, urbanData);

    const result = {
      success: true,
      question,
      location: { latitude: lat, longitude: lon },
      timestamp: new Date().toISOString(),
      urbanData,
      aiResponse,
      metadata: {
        weatherStations: urbanData.weather ? 7 : 0, // Grid points
        pollutionPoints: 11, // Grid points
        eventCount: urbanData.eventCount,
        dataAggregationTime: new Date().toISOString()
      }
    };

    return result;
  } catch (err) {
    console.error("❌ Error in askAboutCity:", err.message);
    return {
      success: false,
      error: err.message,
      question
    };
  }
}

/**
 * Quick health check of urban data without AI query
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @returns {Promise<Object>} Aggregated urban data
 */
async function getUrbanDataSnapshot(lat = 16.5062, lon = 80.6480) {
  return aggregateUrbanData(lat, lon);
}

module.exports = {
  askAboutCity,
  aggregateUrbanData,
  queryWithContext,
  fetchAllEvents,
  getUrbanDataSnapshot
};

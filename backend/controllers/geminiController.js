// controllers/geminiController.js
const { askAboutCity, getUrbanDataSnapshot } = require("../utils/geminiService");

// Default coordinates (Vijayawada)
const DEFAULT_LAT = 16.5062;
const DEFAULT_LON = 80.6480;

/**
 * Query Gemini AI about city conditions
 * POST /api/gemini/ask
 * Body: { question: "What's the weather like?", lat?: number, lon?: number }
 */
const askAboutCity_Controller = async (req, res) => {
  try {
    const { question, lat = DEFAULT_LAT, lon = DEFAULT_LON } = req.body;

    if (!question) {
      return res.status(400).json({ 
        success: false,
        message: "Question is required",
        example: "What were the events going on and how's the air quality?"
      });
    }

    console.log(`❓ Question: "${question}" | Location: ${lat}, ${lon}`);

    const result = await askAboutCity(question, lat, lon);

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        message: "Error processing query",
        error: result.error 
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Error in askAboutCity_Controller:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get current urban data snapshot without AI query
 * GET /api/gemini/data
 * Query: ?lat=16.5062&lon=80.6480 (optional, defaults to Vijayawada)
 */
const getUrbanData_Controller = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
    const lon = parseFloat(req.query.lon) || DEFAULT_LON;

    console.log(`📊 Fetching urban data | Location: ${lat}, ${lon}`);

    const snapshot = await getUrbanDataSnapshot(lat, lon);

    res.json({
      success: true,
      location: { latitude: lat, longitude: lon },
      timestamp: new Date().toISOString(),
      data: snapshot
    });
  } catch (err) {
    console.error("❌ Error in getUrbanData_Controller:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

module.exports = { 
  askAboutCity: askAboutCity_Controller, 
  getUrbanData: getUrbanData_Controller 
};

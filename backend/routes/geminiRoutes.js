// routes/geminiRoutes.js
const express = require("express");
const { askAboutCity, getUrbanData } = require("../controllers/geminiController");

const router = express.Router();

/**
 * POST /api/gemini/ask
 * Query Gemini AI about city conditions
 * 
 * Request body:
 * {
 *   "question": "What events are happening and how's the weather?",
 *   "lat": 16.5062,        // optional, defaults to Vijayawada
 *   "lon": 80.6480         // optional, defaults to Vijayawada
 * }
 */
router.post("/ask", askAboutCity);

/**
 * GET /api/gemini/data
 * Get aggregated urban data (weather, pollution, events) without AI query
 * 
 * Query parameters:
 * ?lat=16.5062&lon=80.6480  // optional, defaults to Vijayawada
 */
router.get("/data", getUrbanData);

module.exports = router;

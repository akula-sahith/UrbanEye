// utils/pollution.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

// 📍 Center
const CENTER = {
  lat: 16.5062,
  lon: 80.6480
};

// 🔥 6 strategic points (~3–5 km spread)
function generateSixPoints(centerLat, centerLon, offset = 3) {
  return [
    [centerLat, centerLon], // center
    [centerLat + offset, centerLon], // north
    [centerLat - offset, centerLon], // south
    [centerLat, centerLon + offset], // east
    [centerLat, centerLon - offset], // west
    [centerLat + offset, centerLon + offset], // northeast
  ];
}

async function fetchPollutionGrid() {
  const grid = generateSixPoints(CENTER.lat, CENTER.lon);

  console.log(`📡 Fetching pollution for ${grid.length} points`);

  const results = await Promise.all(
    grid.map(async ([gLat, gLon]) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${gLat}&lon=${gLon}&appid=${API_KEY}`
        );

        const data = await res.json();
        const pollution = data.list?.[0];

        return {
          lat: gLat,
          lon: gLon,
          aqi: pollution?.main?.aqi || 0,
          components: pollution?.components || {}
        };

      } catch (err) {
        console.error("❌ Pollution fetch error:", err.message);

        return {
          lat: gLat,
          lon: gLon,
          aqi: 0,
          components: {}
        };
      }
    })
  );

  return results;
}

module.exports = { fetchPollutionGrid };
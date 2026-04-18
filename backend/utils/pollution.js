// utils/pollution.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

// ⚠️ FIX: step should NOT be 2 (too large ~200km 😅)
function generateGrid(lat, lon, step = 0.02) {
  return [
    [lat, lon],
    [lat + step, lon],
    [lat - step, lon],
    [lat, lon + step],
    [lat, lon - step],
    [lat + step, lon + step],
    [lat - step, lon - step],
  ];
}

async function fetchPollutionGrid(lat, lon) {
  const grid = generateGrid(lat, lon);

  const results = await Promise.all(
    grid.map(async ([gLat, gLon]) => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${gLat}&lon=${gLon}&appid=${API_KEY}`
      );
      const data = await res.json();

      const pollution = data.list?.[0];

      return {
        lat: gLat,
        lon: gLon,

        // 🔥 main AQI
        aqi: pollution?.main?.aqi || 0,

        // 🔥 detailed components
        components: {
          pm2_5: pollution?.components?.pm2_5 || 0,
          pm10: pollution?.components?.pm10 || 0,
          co: pollution?.components?.co || 0,
          no2: pollution?.components?.no2 || 0,
          o3: pollution?.components?.o3 || 0,
          so2: pollution?.components?.so2 || 0
        }
      };
    })
  );

  return results;
}

module.exports = { fetchPollutionGrid };
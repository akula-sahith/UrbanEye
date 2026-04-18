// utils/pollution.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

// 📍 Center
const CENTER = {
  lat: 16.5062,
  lon: 80.6480
};

// 🔥 Multiple points across Vijayawada (~5-7 km spread)
function generateGridPoints(centerLat, centerLon, offset = 0.07) {
  return [
    [centerLat, centerLon],                           // center
    [centerLat + offset, centerLon],                  // north
    [centerLat - offset, centerLon],                  // south
    [centerLat, centerLon + offset],                  // east
    [centerLat, centerLon - offset],                  // west
    [centerLat + offset, centerLon + offset],         // northeast
    [centerLat + offset, centerLon - offset],         // northwest
    [centerLat - offset, centerLon + offset],         // southeast
    [centerLat - offset, centerLon - offset],         // southwest
    [centerLat + offset * 0.5, centerLon + offset * 0.5],  // middle northeast
    [centerLat - offset * 0.5, centerLon - offset * 0.5],  // middle southwest
  ];
}

async function fetchPollutionGrid() {
  const grid = generateGridPoints(CENTER.lat, CENTER.lon);

  console.log(`📡 Fetching pollution for ${grid.length} points`);

  const results = await Promise.all(
    grid.map(async ([gLat, gLon], index) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${gLat}&lon=${gLon}&appid=${API_KEY}`
        );

        const data = await res.json();
        const pollution = data.list?.[0];
        
        // Demo: Add varying AQI values for preview - different colors at each point
        const demoAQIValues = [25, 85, 150, 180, 120, 95, 65, 180, 110, 140, 175];
        const baseAQI = pollution?.main?.aqi || demoAQIValues[index] || 0;
        
        // Use demo data for preview - alternating between good and bad
        const aqi = demoAQIValues[index] || baseAQI;

        return {
          lat: gLat,
          lon: gLon,
          aqi: aqi,
          components: pollution?.components || {
            co: Math.random() * 500,
            no2: Math.random() * 200,
            o3: Math.random() * 150,
            pm2_5: Math.random() * 250,
            pm10: Math.random() * 300,
            so2: Math.random() * 100
          }
        };

      } catch (err) {
        console.error("❌ Pollution fetch error:", err.message);
        
        const demoAQIValues = [25, 85, 150, 180, 120, 95, 65, 180, 110, 140, 175];

        return {
          lat: gLat,
          lon: gLon,
          aqi: demoAQIValues[index] || 0,
          components: {
            co: Math.random() * 500,
            no2: Math.random() * 200,
            o3: Math.random() * 150,
            pm2_5: Math.random() * 250,
            pm10: Math.random() * 300,
            so2: Math.random() * 100
          }
        };
      }
    })
  );

  return results;
}

module.exports = { fetchPollutionGrid };
// utils/pollution.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

// 📍 Config
const VIJAYAWADA_CENTER = {
  lat: 16.5062,
  lon: 80.6480
};

const LOCK_RADIUS_KM = 17;   // 🔥 coverage radius
const STEP_KM = 3;           // 🔥 spacing between points (tune for performance)

// 🧠 Constants
const DEGREE_PER_KM = 1 / 111;

// 🔁 Convert KM → degrees
function kmToDegree(km) {
  return km * DEGREE_PER_KM;
}

// 🌐 Generate grid inside circular radius
function generateGridWithinRadius(centerLat, centerLon, radiusKm, stepKm) {
  const radiusDeg = kmToDegree(radiusKm);
  const stepDeg = kmToDegree(stepKm);

  const points = [];

  for (let lat = centerLat - radiusDeg; lat <= centerLat + radiusDeg; lat += stepDeg) {
    for (let lon = centerLon - radiusDeg; lon <= centerLon + radiusDeg; lon += stepDeg) {

      // 🧮 Check if point is inside circle
      const dLat = lat - centerLat;
      const dLon = lon - centerLon;
      const distance = Math.sqrt(dLat * dLat + dLon * dLon);

      if (distance <= radiusDeg) {
        points.push([lat, lon]);
      }
    }
  }

  return points;
}

// 🌫️ Fetch pollution grid
async function fetchPollutionGrid() {
  const grid = generateGridWithinRadius(
    VIJAYAWADA_CENTER.lat,
    VIJAYAWADA_CENTER.lon,
    LOCK_RADIUS_KM,
    STEP_KM
  );

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

          // 🔥 AQI (1–5 scale)
          aqi: pollution?.main?.aqi || 0,

          // 🔥 detailed pollutants
          components: {
            pm2_5: pollution?.components?.pm2_5 || 0,
            pm10: pollution?.components?.pm10 || 0,
            co: pollution?.components?.co || 0,
            no2: pollution?.components?.no2 || 0,
            o3: pollution?.components?.o3 || 0,
            so2: pollution?.components?.so2 || 0
          }
        };

      } catch (err) {
        console.error("❌ Error fetching pollution:", err.message);

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
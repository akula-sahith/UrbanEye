// utils/weather.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;
console.log('Using OpenWeather API Key:', API_KEY ? `Present ${API_KEY}` : 'Missing');
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

async function fetchWeatherGrid(lat, lon) {
  const grid = generateGrid(lat, lon);

  console.log(`🌤️ Fetching weather for ${grid.length} points around (${lat}, ${lon})`);

  const results = await Promise.all(
    grid.map(async ([gLat, gLon], index) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${gLat}&lon=${gLon}&appid=${API_KEY}&units=metric`
        );

        if (!res.ok) {
          if (res.status === 401) {
            console.error(`❌ Invalid API key! Please get a new OpenWeather API key from https://openweathermap.org/api`);
            throw new Error(`Invalid API key (401). Get a new key from openweathermap.org`);
          }
          throw new Error(`API responded with status: ${res.status}`);
        }

        const data = await res.json();

        console.log(`✅ Weather for (${gLat.toFixed(4)}, ${gLon.toFixed(4)}): ${data.weather?.[0]?.main || "Unknown"}, ${data.main?.temp || 0}°C`);

        return {
          lat: gLat,
          lon: gLon,

          // 🌤️ weather condition
          condition: {
            id: data.weather?.[0]?.id || 0,
            main: data.weather?.[0]?.main || "Unknown",
            description: data.weather?.[0]?.description || "Unknown",
            icon: data.weather?.[0]?.icon || "",
          },

          // 🌡️ temperature & feel
          main: {
            temp: data.main?.temp || 0,
            feels_like: data.main?.feels_like || 0,
            temp_min: data.main?.temp_min || 0,
            temp_max: data.main?.temp_max || 0,
            pressure: data.main?.pressure || 0,
            humidity: data.main?.humidity || 0,
          },

          // 💨 wind
          wind: {
            speed: data.wind?.speed || 0,
            deg: data.wind?.deg || 0,
          },

          // ☁️ cloud cover %
          clouds: data.clouds?.all || 0,

          // 👁️ visibility in metres
          visibility: data.visibility || 0,
        };
      } catch (err) {
        console.error(`❌ Weather fetch error for (${gLat.toFixed(4)}, ${gLon.toFixed(4)}):`, err.message);

        // Return fallback data for this point
        return {
          lat: gLat,
          lon: gLon,

          // 🌤️ weather condition
          condition: {
            id: 0,
            main: "Unknown",
            description: "Weather data unavailable",
            icon: "",
          },

          // 🌡️ temperature & feel (demo values for Vijayawada)
          main: {
            temp: 28 + Math.random() * 8, // Random temp between 28-36°C (typical for Vijayawada)
            feels_like: 32 + Math.random() * 6,
            temp_min: 24 + Math.random() * 4,
            temp_max: 34 + Math.random() * 6,
            pressure: 1008 + Math.random() * 8,
            humidity: 60 + Math.random() * 25,
          },

          // 💨 wind
          wind: {
            speed: 2 + Math.random() * 4, // Light to moderate wind
            deg: Math.random() * 360,
          },

          // ☁️ cloud cover %
          clouds: Math.random() * 40, // Usually clear to partly cloudy

          // 👁️ visibility in metres
          visibility: 8000 + Math.random() * 2000,
        };
      }
    })
  );

  return results;
}

module.exports = { fetchWeatherGrid };
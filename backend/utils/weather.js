// utils/weather.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

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

  const results = await Promise.all(
    grid.map(async ([gLat, gLon]) => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${gLat}&lon=${gLon}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();

      console.log(`Fetched weather for (${gLat.toFixed(4)}, ${gLon.toFixed(4)})`);
      console.log(`  Condition: ${data.weather?.[0]?.main || "Unknown"}, Temp: ${data.main?.temp || 0}°C`);

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
    })
  );

  return results;
}

module.exports = { fetchWeatherGrid };
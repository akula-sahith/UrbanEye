// test-weather-api.js
require('dotenv').config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const API_KEY = process.env.OPENWEATHER_API_KEY;

async function testWeatherAPI() {
  console.log('🧪 Testing OpenWeather API Key...');
  console.log('API Key:', API_KEY ? 'Set' : 'NOT SET');
  console.log('API Key Length:', API_KEY?.length || 0);

  if (!API_KEY) {
    console.error('❌ OPENWEATHER_API_KEY not found in .env file');
    console.log('Please add: OPENWEATHER_API_KEY=your_api_key_here');
    return;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=16.5062&lon=80.6480&appid=${API_KEY}&units=metric`;
    console.log('🌐 Testing URL:', url.replace(API_KEY, 'HIDDEN'));

    const res = await fetch(url);

    if (res.status === 401) {
      console.error('❌ Invalid API key! Please get a new key from:');
      console.log('https://openweathermap.org/api');
      console.log('1. Create account');
      console.log('2. Go to API keys section');
      console.log('3. Generate new key');
      console.log('4. Update .env file');
      return;
    }

    if (!res.ok) {
      console.error(`❌ API Error: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    console.log('✅ API Key is valid!');
    console.log('📍 Location:', data.name);
    console.log('🌡️ Temperature:', data.main?.temp, '°C');
    console.log('🌤️ Weather:', data.weather?.[0]?.main);
    console.log('💨 Wind Speed:', data.wind?.speed, 'm/s');

  } catch (err) {
    console.error('❌ Network Error:', err.message);
  }
}

testWeatherAPI();
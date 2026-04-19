const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

require('dotenv').config();

const key = process.env.OPENWEATHER_API_KEY;
console.log('Testing key:', key ? 'Present' : 'Missing');

(async () => {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=16.5062&lon=80.648&appid=${key}&units=metric`);
    console.log('Status:', res.status, res.statusText);
    if (res.ok) {
      const data = await res.json();
      console.log('Success:', data.name);
    } else {
      console.log('Failed');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
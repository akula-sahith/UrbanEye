// utils/geocode.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const geocodeLocation = async (place) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${key}`
  );

  const data = await res.json();

  // ❌ handle errors
  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    throw new Error("Location not found");
  }

  // ✅ extract lat/lng
  const { lat, lng } = data.results[0].geometry.location;

  // 🔥 return in your existing format [lng, lat]
  return [lng, lat];
};

module.exports = { geocodeLocation };
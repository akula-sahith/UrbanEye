// utils/geocode.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const geocodeLocation = async (place) => {
  const token = process.env.MAPBOX_TOKEN;

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${token}`
  );

  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error("Location not found");
  }

  return data.features[0].center; // [lng, lat]
};

module.exports = { geocodeLocation };
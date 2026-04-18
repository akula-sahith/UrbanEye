// controllers/eventController.js
const Event = require("../models/Event");
const { geocodeLocation } = require("../utils/geocode");
const { moderateEvent } = require("../utils/moderate");

const registerEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      organiser,
      location_name,
      start_at,
      end_at
    } = req.body;

    // 1️⃣ Geocode
    const [lng, lat] = await geocodeLocation(location_name);

    // 2️⃣ Moderate
    const moderation = await moderateEvent({ name, description });

    if (moderation.status === "rejected") {
      return res.status(400).json({
        message: "Event rejected",
        reason: moderation.reason
      });
    }

    // 3️⃣ Save
    const event = await Event.create({
      name,
      description,
      category,
      organiser,
      location_name,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      start_at,
      end_at,
      status: moderation.status
    });

    res.status(201).json({
      message: "Event created",
      event
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerEvent };
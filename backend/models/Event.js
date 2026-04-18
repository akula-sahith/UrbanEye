// models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  organiser: String,

  location_name: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  start_at: Date,
  end_at: Date,

  status: {
    type: String,
    enum: ["approved", "pending", "rejected"],
    default: "approved"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

// indexes
eventSchema.index({ location: "2dsphere" });
eventSchema.index({ end_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Event", eventSchema);
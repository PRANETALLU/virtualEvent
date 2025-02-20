const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dateTime: { type: Date, required: true }, // Stores both date and time
  venue: { type: String, required: true }, // Required, can be 'Online' or a location
  price: { type: Number, default: 0 }, // Free or paid event
  category: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  liveStreamUrl: { type: String, default: "" }, // WebRTC-based stream link
  chatEnabled: { type: Boolean, default: true },
  recordingUrl: { type: String, default: "" }, // Optional recorded session
  ended: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);

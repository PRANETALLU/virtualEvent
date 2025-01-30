const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String }, // Can be 'Online' or a physical location
  price: { type: Number, default: 0 }, // Free or paid event
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  liveStreamUrl: { type: String }, // WebRTC-based stream link
  chatEnabled: { type: Boolean, default: true },
  recordingUrl: { type: String }, // Optional recorded session
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);

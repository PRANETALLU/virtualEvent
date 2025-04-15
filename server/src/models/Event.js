const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true }
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dateTime: { type: Date, required: true }, 
  venue: { type: String, required: true }, 
  price: { type: Number, default: 0 }, 
  category: { type: String, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  liveStreamUrl: { type: String, default: "" }, 
  chatEnabled: { type: Boolean, default: true },
  recordingUrl: { type: String, default: "" }, 
  ended: { type: Boolean, default: false },
  files: [FileSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);

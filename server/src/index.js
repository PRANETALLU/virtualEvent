const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const socketIo = require("socket.io");
const http = require("http");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    allowedHeaders: "Content-Type",
  })
);

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("MongoDB connected"));

app.use("/user", userRoutes);
app.use("/events", eventRoutes);

let activeStreams = {}; // Track active streams by event ID
let eventAttendees = {}; // Track attendees for each event

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle organizer joining
  socket.on("organizer-joined", ({ peerId, eventId }) => {
    console.log(`Organizer joined: ${peerId} for event ${eventId}`);
    activeStreams[eventId] = { peerId, isStreamActive: false };
    eventAttendees[eventId] = { organizer: peerId, attendees: [] };
  });

  // Handle viewer joining
  socket.on("viewer-joined", ({ peerId, eventId }) => {
    console.log(`Viewer joined: ${peerId} for event ${eventId}`);
    if (eventAttendees[eventId]) {
      eventAttendees[eventId].attendees.push(peerId);
    } else {
      eventAttendees[eventId] = { organizer: null, attendees: [peerId] };
    }

    // Notify viewer if the stream is active
    if (activeStreams[eventId]?.isStreamActive) {
      socket.emit("stream-started"); // Notify viewer that stream is active
    }
  });

  // Handle checking stream status
  socket.on("check-stream-status", ({ eventId }) => {
    const isStreamActive = activeStreams[eventId]?.isStreamActive;
    socket.emit("stream-status", isStreamActive);
  });

  // Start stream
  socket.on("start-stream", ({ peerId, eventId }) => {
    console.log(`Stream started by organizer: ${peerId} for event ${eventId}`);
    if (activeStreams[eventId]) {
      activeStreams[eventId].isStreamActive = true;
      // Notify all attendees that the stream has started (not the organizer)
      eventAttendees[eventId].attendees.forEach((attendeePeerId) => {
        io.to(attendeePeerId).emit("stream-started");
      });
    }
  });

  // Stop stream
  socket.on("stop-stream", ({ eventId }) => {
    console.log(`Stream stopped for event ${eventId}`);
    if (activeStreams[eventId]) {
      activeStreams[eventId].isStreamActive = false;
      // Notify all attendees that the stream has stopped (not the organizer)
      eventAttendees[eventId].attendees.forEach((attendeePeerId) => {
        io.to(attendeePeerId).emit("stream-stopped");
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from active streams and attendees list
    for (const eventId in eventAttendees) {
      if (eventAttendees[eventId].organizer === socket.id) {
        delete activeStreams[eventId];
        delete eventAttendees[eventId];
      } else {
        eventAttendees[eventId].attendees = eventAttendees[eventId].attendees.filter(id => id !== socket.id);
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

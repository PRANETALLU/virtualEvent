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

// Track active streams by event
const activeStreams = new Map();

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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("organizer-joined", ({ peerId, eventId }) => {
    console.log(`Organizer joined event ${eventId} with Peer ID: ${peerId}`);
    
    // Store organizer info for this event
    activeStreams.set(eventId, {
      organizerPeerId: peerId,
      organizerSocketId: socket.id
    });
    
    // Join the event's room
    socket.join(eventId);
  });

  socket.on("viewer-joined", ({ peerId, eventId }) => {
    console.log(`Viewer joined event ${eventId} with Peer ID: ${peerId}`);
    
    const eventStream = activeStreams.get(eventId);
    if (eventStream?.organizerPeerId) {
      // Notify only this viewer about the organizer's peer ID
      socket.emit("viewer-joined", { 
        viewerPeerId: peerId,
        organizerPeerId: eventStream.organizerPeerId 
      });
    }
    
    // Join the event's room
    socket.join(eventId);
  });

  socket.on("start-stream", ({ eventId }) => {
    // Notify all users in this event's room
    io.to(eventId).emit("stream-started");
  });

  socket.on("stop-stream", ({ eventId }) => {
    const eventStream = activeStreams.get(eventId);
    
    if (eventStream?.organizerSocketId === socket.id) {
      activeStreams.delete(eventId);
      io.to(eventId).emit("stream-stopped");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Check all active streams for the disconnected socket
    for (const [eventId, stream] of activeStreams.entries()) {
      if (stream.organizerSocketId === socket.id) {
        activeStreams.delete(eventId);
        io.to(eventId).emit("stream-stopped");
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
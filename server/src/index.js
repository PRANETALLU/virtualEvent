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
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("MongoDB connected"));

app.use("/user", userRoutes);
app.use("/events", eventRoutes);


// Stream tracking with metadata
const activeStreams = new Map(); // Map eventId to stream info
const eventParticipants = new Map(); // Map eventId to participants

// Utility function to get room participants
const getRoomParticipants = (eventId) => {
  return eventParticipants.get(eventId) || { organizer: null, viewers: new Set() };
};

// Utility function to broadcast to room
const broadcastToRoom = (eventId, event, data, excludeSocketId = null) => {
  const room = getRoomParticipants(eventId);
  const sockets = Array.from(room.viewers);
  if (room.organizer) sockets.push(room.organizer);
  
  sockets.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      io.to(socketId).emit(event, data);
    }
  });
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle organizer joining
  socket.on("organizer-joined", ({ peerId, eventId }) => {
    console.log(`Organizer joined: ${peerId} for event ${eventId}`);
    
    const streamInfo = activeStreams.get(eventId) || {
      organizerPeerId: peerId,
      isActive: false,
      startTime: null
    };
    
    activeStreams.set(eventId, streamInfo);
    
    const participants = getRoomParticipants(eventId);
    participants.organizer = socket.id;
    eventParticipants.set(eventId, participants);
    
    socket.join(eventId);
    
    // Send current stream status to organizer
    socket.emit("stream-status", {
      active: streamInfo.isActive,
      organizerPeerId: streamInfo.organizerPeerId
    });
  });

  // Handle viewer joining
  socket.on("viewer-joined", ({ peerId, eventId }) => {
    console.log(`Viewer joined: ${peerId} for event ${eventId}`);
    
    const participants = getRoomParticipants(eventId);
    participants.viewers.add(socket.id);
    eventParticipants.set(eventId, participants);
    
    socket.join(eventId);
    
    // Send current stream status to viewer
    const streamInfo = activeStreams.get(eventId);
    if (streamInfo) {
      socket.emit("stream-status", {
        active: streamInfo.isActive,
        organizerPeerId: streamInfo.organizerPeerId
      });
    }
  });

  // Handle stream start
  socket.on("start-stream", ({ peerId, eventId }) => {
    console.log(`Stream started by organizer: ${peerId} for event ${eventId}`);
    
    const streamInfo = {
      organizerPeerId: peerId,
      isActive: true,
      startTime: Date.now()
    };
    
    activeStreams.set(eventId, streamInfo);
    
    // Notify all room participants
    broadcastToRoom(eventId, "stream-started", {
      organizerPeerId: peerId
    });
  });

  // Handle stream stop
  socket.on("stop-stream", ({ eventId }) => {
    console.log(`Stream stopped for event ${eventId}`);
    
    const streamInfo = activeStreams.get(eventId);
    if (streamInfo) {
      streamInfo.isActive = false;
      streamInfo.startTime = null;
      activeStreams.set(eventId, streamInfo);
      
      // Notify all room participants
      broadcastToRoom(eventId, "stream-stopped", {});
    }
  });

  // Handle stream status check
  socket.on("check-stream-status", ({ eventId }) => {
    const streamInfo = activeStreams.get(eventId);
    socket.emit("stream-status", {
      active: streamInfo?.isActive || false,
      organizerPeerId: streamInfo?.organizerPeerId || null
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Clean up all events this socket was participating in
    eventParticipants.forEach((participants, eventId) => {
      // If organizer disconnected
      if (participants.organizer === socket.id) {
        const streamInfo = activeStreams.get(eventId);
        if (streamInfo?.isActive) {
          streamInfo.isActive = false;
          streamInfo.startTime = null;
          activeStreams.set(eventId, streamInfo);
          broadcastToRoom(eventId, "stream-stopped", {});
        }
        participants.organizer = null;
      }
      
      // Remove from viewers if present
      participants.viewers.delete(socket.id);
      
      // Clean up empty rooms
      if (!participants.organizer && participants.viewers.size === 0) {
        eventParticipants.delete(eventId);
        activeStreams.delete(eventId);
      } else {
        eventParticipants.set(eventId, participants);
      }
    });
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
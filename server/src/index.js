const express = require("express");
const cors = require("cors");
const mongooseExpress = require("mongoose");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./controllers/paymentRouting");
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
// const express = require('express');
// const bodyParser = require('body-parser');
// const paymentRoutes = require('./routes/paymentRoutes');
// require('dotenv').config();
// app.use(bodyParser.json());
// app.use('/api/payments', paymentRoutes);
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
const mongoURI = process.env.MONGO_URI;
mongooseExpress.connect(mongoURI);
const db = mongooseExpress.connection;
db.on("error", (error) => console.error("MongoDB connection error:", error));
db.once("open", () => console.log("MongoDB connected"));
app.use("/user", userRoutes);
app.use("/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
// Stream tracking and chat storage
// const activeStreams = new Map(); 
// const eventParticipants = new Map(); 
const eventMessages = {}; 
const events = {};
/*const getRoomParticipants = (eventId) => {
  return eventParticipants.get(eventId) || { organizer: null, viewers: new Set() };
};

const broadcastToRoom = (eventId, eventName, data, excludeSocketId = null) => {
  const room = getRoomParticipants(eventId);
  const sockets = Array.from(room.viewers);
  if (room.organizer) sockets.push(room.organizer);
  sockets.forEach((socketId) => {
    if (socketId !== excludeSocketId) {
      io.to(socketId).emit(eventName, data);
    }
  });
};*/

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("organizer-ready", ({ eventId, peerId }) => {
    events[eventId] = peerId;
    socket.broadcast.emit("organizer-ready", { peerId });
  });

  /*socket.on("organizer-joined", ({ peerId, eventId }) => {
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

    socket.emit("stream-status", {
      active: streamInfo.isActive,
      organizerPeerId: streamInfo.organizerPeerId
    });
  });

  // Viewer joins stream
  socket.on("viewer-joined", ({ peerId, eventId }) => {
    console.log(`Viewer joined: ${peerId} for event ${eventId}`);

    const participants = getRoomParticipants(eventId);
    participants.viewers.add(socket.id);
    eventParticipants.set(eventId, participants);

    socket.join(eventId);

    const streamInfo = activeStreams.get(eventId);
    if (streamInfo) {
      socket.emit("stream-status", {
        active: streamInfo.isActive,
        organizerPeerId: streamInfo.organizerPeerId
      });
    }
  });

  // Start stream event
  socket.on("start-stream", ({ peerId, eventId }) => {
    console.log(`Stream started by organizer: ${peerId} for event ${eventId}`);

    const streamInfo = {
      organizerPeerId: peerId,
      isActive: true,
      startTime: Date.now()
    };
    activeStreams.set(eventId, streamInfo);

    broadcastToRoom(eventId, "stream-started", { organizerPeerId: peerId });
  });

  // Stop stream event
  socket.on("stop-stream", ({ eventId }) => {
    console.log(`Stream stopped for event ${eventId}`);

    const streamInfo = activeStreams.get(eventId);
    if (streamInfo) {
      streamInfo.isActive = false;
      streamInfo.startTime = null;
      activeStreams.set(eventId, streamInfo);
      broadcastToRoom(eventId, "stream-stopped", {});
    }
  });

  // Check stream status
  socket.on("check-stream-status", ({ eventId }) => {
    const streamInfo = activeStreams.get(eventId);
    socket.emit("stream-status", {
      active: streamInfo?.isActive || false,
      organizerPeerId: streamInfo?.organizerPeerId || null
    });
  });*/

  // Chat: client joins an event room
  socket.on("join-event", (eventId) => {
    console.log(`Socket ${socket.id} joined event ${eventId}`);
    socket.join(eventId);

    if (eventMessages[eventId]) {
      socket.emit("previous-messages", eventMessages[eventId]);
    }
  });

  // Chat: client sends a new message
  socket.on("send-message", (data) => {
    const { eventId, message } = data;
    if (!eventMessages[eventId]) {
      eventMessages[eventId] = [];
    }
    eventMessages[eventId].push(message);
    io.to(eventId).emit("new-message", message);
  });

  // Handle disconnection and clean up participant data
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    /*eventParticipants.forEach((participants, eventId) => {
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
      // Clean up if no participants remain
      if (!participants.organizer && participants.viewers.size === 0) {
        eventParticipants.delete(eventId);
        activeStreams.delete(eventId);
      } else {
        eventParticipants.set(eventId, participants);
      }
    });*/
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
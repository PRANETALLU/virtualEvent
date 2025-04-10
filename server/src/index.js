const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Event = require('./models/Event');
const User = require('./models/User');
require("dotenv").config();


const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For handling form data
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("MongoDB connected"));


const baseUploadDir = path.join(__dirname, "uploads");
// Create avatars directory
const avatarsDir = path.join(__dirname, "uploads", "avatars");


if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir);
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Add before WebSocket setup
app.put('/user/:id/profile', avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, interests } = req.body;
    
    const updateFields = {
      bio: bio || '',
      interests: interests ? interests.split(',').map(i => i.trim()) : []
    };

    if (req.file) {
      // Delete old avatar if exists
      const user = await User.findById(id);
      if (user && user.avatar) {
        const oldAvatarPath = path.join(__dirname, user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      updateFields.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});





// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

// Track clients by event and role
const clients = new Map(); // Map of eventId -> {organizers: Set, attendees: Set}

// Store chat messages by event
const chatMessages = new Map(); // Map of eventId -> Array of messages

// Track active streams by event
const activeStreams = new Map(); // Map of eventId -> boolean (is stream active)

// WebSocket Upgrade Handling
server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy(); // Reject unwanted connections
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// **Upload File (Creates Event Directory)**
app.post("/upload-file", (req, res) => {
  try {
    const { fileName, fileContent, eventId } = req.body; // Expecting eventId

    if (!fileName || !fileContent || !eventId) {
      return res.status(400).json({ error: "Missing fileName, fileContent, or eventId" });
    }

    const eventDir = path.join(baseUploadDir, eventId);

    // Ensure event-specific directory exists
    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }

    const filePath = path.join(eventDir, fileName);
    fs.writeFileSync(filePath, fileContent, "base64"); // Save file

    res.json({ message: "File uploaded", fileUrl: `/download-file/${eventId}/${fileName}` });
  } catch (error) {
    res.status(500).json({ error: "File upload failed" });
  }
});

// **Download File (from Event Directory)**
app.get("/download-file/:eventId/:fileName", (req, res) => {
  try {
    const { eventId, fileName } = req.params;
    const filePath = path.join(baseUploadDir, eventId, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileData = fs.readFileSync(filePath);
    res.send(fileData);
  } catch (error) {
    res.status(500).json({ error: "File download failed" });
  }
});

// **View File in Browser**
app.get("/view-file/:eventId/:fileName", (req, res) => {
  try {
    const { eventId, fileName } = req.params;
    const filePath = path.join(baseUploadDir, eventId, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileData = fs.readFileSync(filePath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(fileData);
  } catch (error) {
    res.status(500).json({ error: "Failed to view file" });
  }
});

// Add before routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      message: "File upload error", 
      error: err.message 
    });
  }
  res.status(500).json({ 
    message: "Internal server error", 
    error: err.message 
  });
});


// Routes
app.use("/user", userRoutes);
app.use("/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
//app.use('/webhook', webhookRoutes);

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  console.log("Client connected");

  // Store client data
  ws.isAlive = true;
  ws.eventId = null;
  ws.role = null;

  // Handle pings to keep connection alive
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      const { eventId, type, role } = data;

      // Join room message handling
      if (type === "join-room" && eventId) {
        joinRoom(ws, eventId, role || "attendee");

        // Send previous chat messages to the client
        sendPreviousMessages(ws, eventId);
        return;
      }

      if (!eventId) {
        //console.log("Message missing eventId, ignoring");
        return;
      }

      //console.log(`[${new Date().toISOString()}] Received ${type} message for event: ${eventId} from ${role || "unknown role"}`);

      // Handle different message types
      switch (type) {
        case "offer":
          // Handle offer (from organizer to attendees)
          handleOffer(ws, data);
          break;
        case "answer":
          // Handle answer (from attendee to organizer)
          handleAnswer(ws, data);
          break;
        case "ice-candidate":
          // Handle ICE candidate
          handleIceCandidate(ws, data);
          break;
        case "stream-started":
          // Notify all clients that stream has started
          activeStreams.set(eventId, true);
          broadcastToEvent(eventId, {
            type: "stream-started",
            eventId
          }, ws);
          break;
        case "stream-stopped":
          // Notify all clients that stream has stopped
          activeStreams.set(eventId, false);
          broadcastToEvent(eventId, {
            type: "stream-stopped",
            eventId
          }, ws);
          break;
        case "chat-message":
          // Handle chat messages
          handleChatMessage(ws, data);
          break;
        default:
          console.log("Unknown message type:", type);
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    //console.log("Client disconnected");
    if (ws.eventId) {
      leaveRoom(ws, ws.eventId);
    }
  });

  ws.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
});

// Joining an event room
function joinRoom(ws, eventId, role) {
  // Initialize event room if it doesn't exist
  if (!clients.has(eventId)) {
    clients.set(eventId, {
      organizers: new Set(),
      attendees: new Set()
    });
  }

  // Initialize chat message store if it doesn't exist
  if (!chatMessages.has(eventId)) {
    chatMessages.set(eventId, []);
  }

  const eventRoom = clients.get(eventId);

  // Store client info
  ws.eventId = eventId;
  ws.role = role;

  // Add to appropriate set
  if (role === "organizer") {
    eventRoom.organizers.add(ws);
    //console.log(`Organizer joined event ${eventId}. Total: ${eventRoom.organizers.size}`);
  } else {
    eventRoom.attendees.add(ws);
    //console.log(`Attendee joined event ${eventId}. Total: ${eventRoom.attendees.size}`);

    // Check if stream is active for this event and notify organizers about new attendee
    if (activeStreams.get(eventId)) {
      //console.log(`Stream is active for event ${eventId}, requesting fresh offer for new attendee`);
      // Request new offer from organizers
      for (const organizer of eventRoom.organizers) {
        if (organizer.readyState === WebSocket.OPEN) {
          organizer.send(JSON.stringify({
            type: "new-attendee",
            eventId,
            needsOffer: true
          }));
        }
      }
    }
  }

  // Notify client of successful join
  ws.send(JSON.stringify({
    type: "room-joined",
    eventId,
    role,
    streamActive: activeStreams.get(eventId) || false
  }));
}

// Leaving an event room
function leaveRoom(ws, eventId) {
  if (!clients.has(eventId)) return;

  const eventRoom = clients.get(eventId);

  if (ws.role === "organizer") {
    eventRoom.organizers.delete(ws);
    //console.log(`Organizer left event ${eventId}. Remaining: ${eventRoom.organizers.size}`);

    // If last organizer leaves and was streaming, mark stream as inactive
    if (eventRoom.organizers.size === 0 && activeStreams.get(eventId)) {
      activeStreams.set(eventId, false);
      broadcastToEvent(eventId, {
        type: "stream-stopped",
        eventId
      });
    }
  } else {
    eventRoom.attendees.delete(ws);
    //console.log(`Attendee left event ${eventId}. Remaining: ${eventRoom.attendees.size}`);
  }

  // Clean up empty rooms
  if (eventRoom.organizers.size === 0 && eventRoom.attendees.size === 0) {
    clients.delete(eventId);
    //console.log(`Event room ${eventId} removed - no participants left`);

    // Clean up stream status
    activeStreams.delete(eventId);

    // Optionally: we could clean up chat messages here as well
    // chatMessages.delete(eventId);
    // But it might be better to keep them for when people rejoin
  }
}

// Send previous chat messages to a client
function sendPreviousMessages(ws, eventId) {
  if (!chatMessages.has(eventId)) return;

  const messages = chatMessages.get(eventId);
  // Only send the most recent 50 messages to avoid overwhelming the client
  const recentMessages = messages.slice(-50);

  if (recentMessages.length > 0) {
    ws.send(JSON.stringify({
      type: "previous-messages",
      eventId,
      messages: recentMessages
    }));
    //console.log(`Sent ${recentMessages.length} previous messages to client in event ${eventId}`);
  }
}

// Handle chat messages
function handleChatMessage(ws, data) {
  const { eventId, message } = data;

  if (!eventId || !message) {
    console.log("Invalid chat message format");
    return;
  }

  //console.log(`Chat message in ${eventId} from ${message.sender}: ${message.message}`);
  if (message.fileAttachment) {
    console.log(`With file attachment: ${message.fileAttachment.name} (${message.fileAttachment.type})`);
  }

  // Store the message
  if (!chatMessages.has(eventId)) {
    chatMessages.set(eventId, []);
  }

  const messages = chatMessages.get(eventId);
  if (messages.length >= 200) {
    messages.shift(); // Remove the oldest message
  }
  messages.push(message);

  // Broadcast to all clients except the sender
  broadcastToEvent(eventId, {
    type: "chat-message",
    eventId,
    message,
  }, ws); // Excluding sender to prevent duplicate message
}

// Broadcast message to all clients in an event
function broadcastToEvent(eventId, message, except = null) {
  if (!clients.has(eventId)) return;

  const eventRoom = clients.get(eventId);
  const jsonMessage = JSON.stringify(message);

  // Send to organizers
  for (const client of eventRoom.organizers) {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  }

  // Send to attendees
  for (const client of eventRoom.attendees) {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(jsonMessage);
    }
  }
}

function broadcastViewerCount(eventId) {
  if (!clients.has(eventId)) return;
  broadcastToEvent(eventId, { type: "viewer-count", eventId, count: clients.get(eventId).attendees.size });
}

// Handle offer (from organizer to attendees)
const handleOffer = (ws, data) => {
  const { eventId, offer, role, targetAttendee } = data;

  if (role !== "organizer") {
    console.log("Ignoring offer from non-organizer");
    return;
  }

  // Mark the stream as active for this event
  activeStreams.set(eventId, true);

  //console.log(`Broadcasting offer from organizer to attendees for event ${eventId}`);

  // Get event room
  if (!clients.has(eventId)) return;
  const eventRoom = clients.get(eventId);

  const jsonMessage = JSON.stringify({
    type: "offer",
    eventId,
    offer
  });

  // If a specific attendee is targeted (for late joiners)
  if (targetAttendee) {
    for (const client of eventRoom.attendees) {
      if (client.id === targetAttendee && client.readyState === WebSocket.OPEN) {
        //console.log(`Sending offer to specific attendee: ${targetAttendee}`);
        client.send(jsonMessage);
        return;
      }
    }
  }

  // Otherwise send to all attendees
  for (const client of eventRoom.attendees) {
    if (client.readyState === WebSocket.OPEN) {
      //console.log("Sending offer to attendee");
      client.send(jsonMessage);
    }
  }
};

// Handle answer (from attendee to organizer)
const handleAnswer = (ws, data) => {
  const { eventId, answer, role, targetConnection } = data;

  if (role !== "attendee") {
    console.log("Ignoring answer from non-attendee");
    return;
  }

  //console.log(`Sending answer from attendee to organizer for event ${eventId}`);

  // Get event room
  if (!clients.has(eventId)) return;
  const eventRoom = clients.get(eventId);

  // Send only to organizers
  const jsonMessage = JSON.stringify({
    type: "answer",
    eventId,
    answer,
    connectionId: targetConnection
  });

  for (const client of eventRoom.organizers) {
    if (client.readyState === WebSocket.OPEN) {
      //console.log("Sending answer to organizer");
      client.send(jsonMessage);
    }
  }
};

// Handle ICE candidate (from any user to relevant parties)
const handleIceCandidate = (ws, data) => {
  const { eventId, candidate, role, connectionId } = data;

  //console.log(`Handling ICE candidate from ${role} for event ${eventId}`);

  // Get event room
  if (!clients.has(eventId)) return;
  const eventRoom = clients.get(eventId);

  const jsonMessage = JSON.stringify({
    type: "ice-candidate",
    eventId,
    candidate,
    connectionId
  });

  // If from organizer, send to attendees
  if (role === "organizer") {
    for (const client of eventRoom.attendees) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonMessage);
      }
    }
  }
  // If from attendee, send to organizers
  else if (role === "attendee") {
    for (const client of eventRoom.organizers) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonMessage);
      }
    }
  }
};

// Keep-alive mechanism
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

server.listen(5000, () => console.log(`Server running on port 5000`));

module.exports = { app, server };



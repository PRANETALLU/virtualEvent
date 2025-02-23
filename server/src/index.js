const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const socketIo = require('socket.io'); 
const http = require('http');
require('dotenv').config(); 

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }
});
<<<<<<< Updated upstream
=======
app.use(express.json());
 //const express = require('express');
// const bodyParser = require('body-parser');
// const paymentRoutes = require('./routes/paymentRoutes');
 //require('dotenv').config();
 //app.use(bodyParser.json());
// app.use('/api/payments', paymentRoutes);
///// const PORT = process.env.PORT || 5001;
 ///app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
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
>>>>>>> Stashed changes

app.use(express.json());
app.use(cookieParser()); // To parse cookies
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: 'Content-Type'
}));

const mongoURI = process.env.MONGO_URI; 
mongoose.connect(mongoURI);

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB connection successful');
});

// Use the user routes
app.use('/user', userRoutes);
app.use('/events', eventRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a specific event room (for event-specific chat)
  socket.on('join_event', (eventId) => {
    socket.join(eventId);
    console.log(`User joined event room: ${eventId}`);
  });

  // Send a message to the event room
  socket.on('send_message', (data) => {
    const { eventId, message, username } = data;
    io.to(eventId).emit('receive_message', { username, message });
  });

  // When a user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


io.on("connection", (socket) => {
  socket.on("stream", (data) => {
    socket.broadcast.emit("view", data);
  });
});

<<<<<<< Updated upstream
app.listen(5000, () => {
  console.log('Server is running on port 5000');
=======
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
>>>>>>> Stashed changes
});

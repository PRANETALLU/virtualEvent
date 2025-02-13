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

// Store active streams by event ID
let activeStreams = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining a room (event)
  socket.on('join-room', (eventId) => {
    console.log(`User joined room: ${eventId}`);
    socket.join(eventId); // Join the room
  });

  // Handle receiving a stream from the organizer
  socket.on('start-stream', ({ eventId, streamData }) => {
    console.log(`Stream started for event: ${eventId}`);
    
    // Store stream data along with some metadata like organizer ID
    activeStreams[eventId] = {
      streamData: streamData,
      organizerId: socket.id,  // Store the socket ID of the organizer
      status: 'active'  // Can be 'active', 'inactive', etc.
    };
    
    // Broadcast the stream to all users in the room (attendees)
    io.to(eventId).emit('receive-stream', streamData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');
    
    // Check if the disconnected user was an organizer and handle stream cleanup
    for (const [eventId, stream] of Object.entries(activeStreams)) {
      if (stream.organizerId === socket.id) {
        // Cleanup the stream for this event
        delete activeStreams[eventId];
        console.log(`Stream for event ${eventId} stopped due to organizer disconnect`);
        
        // Notify attendees to stop the stream
        io.to(eventId).emit('stop-stream');
      }
    }
  });

  // Optional: Handle any errors or other socket events
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

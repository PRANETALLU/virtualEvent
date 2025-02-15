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

let organizerPeerId = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("organizer-joined", (peerId) => {
    console.log("Organizer joined with Peer ID:", peerId);
    organizerPeerId = peerId;
    socket.broadcast.emit("stream-started");
  });

  socket.on("viewer-joined", (peerId) => {
    console.log("Viewer joined with Peer ID:", peerId);
    if (organizerPeerId) {
      socket.emit("viewer-joined", organizerPeerId);
    }
  });

  socket.on("start-stream", () => {
    io.emit("stream-started");
  });

  socket.on("stop-stream", () => {
    organizerPeerId = null;
    io.emit("stream-stopped");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

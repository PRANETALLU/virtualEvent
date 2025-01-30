const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes'); // Adjust the path
require('dotenv').config(); 

const app = express();
app.use(express.json());
app.use(cookieParser()); // To parse cookies
app.use(cors({
    origin: 'http://localhost:3000',
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

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

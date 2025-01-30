const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes'); // Adjust the path

const app = express();
app.use(express.json());
app.use(cookieParser()); // To parse cookies

// Use the user routes
app.use('/user', userRoutes);

// MongoDB connection and other app setup here...

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

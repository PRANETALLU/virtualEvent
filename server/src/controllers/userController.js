const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const secret = process.env.SECRET_KEY; // Ideally, use environment variables for sensitive data

// Sign up logic
exports.signup = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json("Username already taken, please choose a different one");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ newUser, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(404).json({ message: "Invalid username" });
    }

    // Compare passwords (assuming the stored password is hashed)
    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) {
        console.error("JWT Signing Error:", err);
        return res.status(500).json({ message: "Error generating token" });
      }

      res.cookie('token', token, { httpOnly: true }).json({
        id: userDoc._id,
        username,
        token, // Include the token in the response
        message: "Login successful"
      });
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
      res.clearCookie('token').json({ message: "Logout successful" });
  } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
  }
};
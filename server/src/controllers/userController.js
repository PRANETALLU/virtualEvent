const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require("../models/Event");
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Get user information
exports.getUserInfo = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL params
    const user = await User.findById(id).select('-password'); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      interests: user.interests,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { id } = req.params; 
    const { preferences } = req.body; 

    if (!Array.isArray(preferences) || preferences.some(p => typeof p !== "string")) {
      return res.status(400).json({ message: "Invalid preferences format" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { preferences },
      { new: true, runValidators: true } 
    ).select('-password'); 

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Preferences updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find events that match the user's interests
    const recommendations = await Event.find({
      tags: { $in: user.interests },
    }).limit(10);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: error.message });
  }
};

const path = require('path');
const fs = require('fs');

exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, interests } = req.body;
    let avatar;

    if (req.file) {
      const avatarPath = path.join(__dirname, '../uploads/avatars', req.file.filename);
      avatar = `/uploads/avatars/${req.file.filename}`;
      
      // Delete old avatar file if it exists
      if (req.user.avatar) {
        const oldAvatarPath = path.join(__dirname, '..', req.user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
    }

    const updatedFields = {
      bio,
      interests: interests ? interests.split(',').map(i => i.trim()) : undefined,
    };
    if (avatar) updatedFields.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password - Generate Token & Send Email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate password reset token (expires in 1 hour)
    const resetToken = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

    // Send email with reset link
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password - Verify Token & Update Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "Invalid token or user not found" });
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token", error: error.message });
  }
};
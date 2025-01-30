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
    const userDoc = await User.findOne({ username });
    if (!userDoc) { // if username does not exist
      res.status(404).json("Invalid username");
      return;
    }
    if (password === userDoc.password) { // if password is correct
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) {
          throw err;
        }
        else {
          res.cookie('token', token).json({
            id: userDoc._id,
            username
          });
        }
      });
    }
    else {
      res.status(400).json("Invalid Password")
    }
};

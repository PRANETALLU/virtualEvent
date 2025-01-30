const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const secret = process.env.SECRET_KEY; // Ideally, use environment variables for sensitive data

// Sign up logic
exports.signup = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json("Username already taken, please choose a different one");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create a new user
        const newUser = new User({ name, username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ newUser, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userDoc = await User.findOne({ email });

        if (!userDoc) { // If email does not exist
            return res.status(404).json("Invalid email");
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, userDoc.password);

        if (isPasswordValid) { // If password is correct
            // Sign a JWT token
            const token = userDoc.generateToken();

            // Send the token in a cookie and return user data
            res.cookie('token', token, { httpOnly: true, secure: true }).json({
                id: userDoc._id,
                name: userDoc.name,
                email: userDoc.email,
                token, // Send the token in the response as well
            });
        } else {
            res.status(400).json("Invalid Password");
        }
    } catch (err) {
        res.status(500).json("Server error");
    }
};

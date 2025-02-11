const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.SECRET_KEY;

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    console.log('Postman Token', token)
    if (!token) {
        return res.status(401).json({ message: "Unauthorized Authentication" });
    }
  
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decoded; // Store decoded token data in request object
        next();
    });
  };
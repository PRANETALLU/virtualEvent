const express = require('express');
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to your Express.js app!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

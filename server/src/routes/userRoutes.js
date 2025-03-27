const express = require('express');
const router = express.Router();
const { login, signup, logout, getUserInfo, updatePreferences, getRecommendations } = require('../controllers/userController'); // Import controller functions


router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/:id', getUserInfo);
router.put('/:id/preferences', updatePreferences);

module.exports = router;

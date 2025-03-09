const express = require('express');
const { getUserNotifications, markNotificationRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', authMiddleware, getUserNotifications);
router.put('/:id/read', authMiddleware, markNotificationRead);

module.exports = router
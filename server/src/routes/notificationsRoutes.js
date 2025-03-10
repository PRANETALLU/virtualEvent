const express = require('express');
const { getUserNotifications, markNotificationRead } = require('../controllers/notificationsController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', verifyToken, getUserNotifications);
router.put('/:id/read', verifyToken, markNotificationRead);

module.exports = router
const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, addAttendee } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');
const eventController = require('../controllers/eventController');

// Route to create an event
router.post('/create', verifyToken, createEvent);

// Route to get all events
router.get('/', getAllEvents);

// Route to get a single event by ID
router.get('/:id', getEventById);

// Route to update an event (requires token verification)
router.put('/:id', verifyToken, updateEvent);

// Route to delete an event (requires token verification)
router.delete('/:id', verifyToken, deleteEvent);

// Route to add an attendee to an event (requires token verification)
router.post('/:eventId/attendees', verifyToken, addAttendee);

// Start Livestream (Only Organizer)
router.post('/:eventId/livestream/start', verifyToken, eventController.startLivestream);

// Stop Livestream (Only Organizer)
router.post('/:eventId/livestream/stop', verifyToken, eventController.stopLivestream);

// Get Livestream URL
router.get('/:eventId/livestream', verifyToken, eventController.getLivestream);

module.exports = router;

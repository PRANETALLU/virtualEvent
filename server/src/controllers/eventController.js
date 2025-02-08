const Event = require('../models/Event');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/*const secret = process.env.SECRET_KEY;

// Middleware for token verification
const verifyToken = require('../middleware/authMiddleware');*/

// Create Event
exports.createEvent = async (req, res) => {
  const { title, description, dateTime, venue, price } = req.body;

  try {
    // Debug log to check what's coming from the middleware
    console.log('Full request object:', {
      user: req.user,
      headers: req.headers
    });

    // Verify we have a user before proceeding
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Unauthorized - No valid user found'
      });
    }

    const newEvent = new Event({
      title,
      description,
      dateTime,
      venue,
      price,
      organizer: req.user.id,  // Make sure this is getting set
      attendees: [req.user.id]
    });

    const savedEvent = await newEvent.save();
    
    res.status(201).json({
      message: 'Event created successfully',
      event: savedEvent
    });

  } catch (err) {
    console.error('Detailed error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// Get all Events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'username email').populate('attendees', 'username email');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a single Event by ID
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id).populate('organizer', 'username email').populate('attendees', 'username email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, venue, price, liveStreamUrl, chatEnabled, recordingUrl } = req.body;

  try {
    const { user } = req; // User is added to the request object by verifyToken middleware

    // Find and update the event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this event" });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.venue = venue || event.venue;
    event.price = price || event.price;
    event.liveStreamUrl = liveStreamUrl || event.liveStreamUrl;
    event.chatEnabled = chatEnabled !== undefined ? chatEnabled : event.chatEnabled;
    event.recordingUrl = recordingUrl || event.recordingUrl;

    await event.save();

    res.status(200).json({ event, message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const { user } = req; // User is added to the request object by verifyToken middleware

    // Find and delete the event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this event" });
    }
    const deletedEvent = await Event.findByIdAndDelete(id);

    res.status(200).json({ deletedEvent, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add Attendee to Event
exports.addAttendee = async (req, res) => {
  const { eventId } = req.params;

  try {
    const { user } = req; // User is added to the request object by verifyToken middleware

    // Add user as an attendee to the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.attendees.some(attendee => attendee._id.toString() === user.id.toString())) {
      return res.status(400).json({ message: "You are already attending this event" });
    }

    event.attendees.push(user.id);
    await event.save();

    res.status(200).json({ event, message: 'Attendee added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.startLivestream = async (req, res) => {
  const { eventId } = req.params;
  
  try {
    const { user } = req; // User is added to the request object by verifyToken middleware

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Only the organizer can start the livestream" });
    }

    // Generate a livestream link
    const streamUrl = `http://localhost:3000/watch/${eventId}`;

    // Update event with the livestream link
    event.liveStreamUrl = streamUrl;
    await event.save();

    res.status(200).json({ event, message: "Livestream started successfully", streamUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.stopLivestream = async (req, res) => {
  const { eventId } = req.params;

  try {
    const { user } = req;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is the organizer
    if (event.organizer.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Only the organizer can stop the livestream" });
    }

    // Remove livestream URL
    event.liveStreamUrl = "";
    await event.save();

    res.status(200).json({ message: "Livestream stopped successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getLivestream = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.liveStreamUrl) {
      return res.status(400).json({ message: "Livestream has not started yet" });
    }

    res.status(200).json({ liveStreamUrl: event.liveStreamUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

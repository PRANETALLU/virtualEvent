const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingID: { type: String, required: true, unique: true },
  isPaid: { type: Boolean, default: false }, // Whether the ticket is paid
  paymentDetails: { type: Object }, // Store payment details securely (can be an object with data like payment method)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ticket', TicketSchema);

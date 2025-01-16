const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
  });
  
module.exports = mongoose.model('Ticket', TicketSchema);
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  amount: { type: Number, required: true },
  stripePaymentId: { type: String, required: true }, // Store Stripe payment ID securely
  status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);

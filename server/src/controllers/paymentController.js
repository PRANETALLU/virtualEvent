const Payment = require('../models/Payment');

exports.savePayment = async (req, res) => {
  try {
    const { stripePaymentId, amount } = req.body;
 
    const payment = await Payment.create({
      stripePaymentId,
      amount,
      status: 'Success'
    });
    
    res.status(201).json({ message: 'Payment saved successfully', payment });
  } catch (err) {
    console.error('Error saving payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
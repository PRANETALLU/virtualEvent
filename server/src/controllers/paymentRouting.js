const express = require('express');
const { createCheckoutSession } = require('./stripeService');
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
  const { amount, eventId } = req.body; 
  try {
    const session = await createCheckoutSession(amount, eventId);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error in /create-checkout-session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
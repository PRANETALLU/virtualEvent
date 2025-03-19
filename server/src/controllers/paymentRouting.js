const express = require('express');
const { createPaymentIntent } = require('./stripeService');
const { savePayment } = require('./paymentController');
const router = express.Router();

router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await createPaymentIntent(amount);
    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error in /create-payment-intent route:', error);
    res.status(500).send({ error: error.message });
  }
});

router.post('/save-payment', async (req, res) => {
  await savePayment(req, res);
});

module.exports = router;
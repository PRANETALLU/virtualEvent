const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create a checkout session
router.post('/checkout', paymentController.createCheckoutSession);

// Handle successful checkout (redirect from Stripe)
router.get('/success', paymentController.handleCheckoutSuccess);

router.post('/payment-status', paymentController.paymentStatus)

module.exports = router;

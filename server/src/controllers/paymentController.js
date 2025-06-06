const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const Event = require('../models/Event');
const { sendEmail } = require('../services/emailService');

exports.createCheckoutSession = async (req, res) => {
  const { amount, eventId, userId } = req.body;
  try {
    const YOUR_DOMAIN = process.env.YOUR_DOMAIN || 'http://localhost:5173';

    // Ensure amount is in cents
    const amountInCents = amount;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Live Stream Access',
          },
          unit_amount: amountInCents, // Amount in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
      metadata: { userId, eventId },
    });

    console.log('Stripe Checkout session created:', session);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error in /create-checkout-session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle successful checkout
exports.handleCheckoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    // Ensure the session is paid
    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      const eventId = session.metadata.eventId;
      const amount = session.amount_total / 100; 
      const stripePaymentId = session.payment_intent;
      const user = await User.findById(userId);
      const eventObj = await Event.findById(eventId);

      if (!user || !eventObj) {
        return res.status(400).json({ message: "Invalid user or event" });
      }
      const payment = new Payment({
        user: userId,
        event: eventId,
        amount,
        stripePaymentId,
      });
      await payment.save();
      console.log('Payment successfully recorded:', payment);
      if (user.email) {
        const emailHtml = `Hello ${user.username || ''},
                           Your payment for the event "${eventObj.title}" has been successfully processed. You now have access to join the event.
                           Thank you for your payment!`;
        await sendEmail(user.email, 'Streamify Payment Confirmation', emailHtml);
        console.log("Payment confirmation email sent to", user.email);
      } else {
        console.log("User email not found; email notification not sent.");
      }
      return res.status(200).json({ message: 'Payment successful. You can join the event.', payment, hasPaid: true });
    } else {
      return res.status(400).json({ message: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Error in handleCheckoutSuccess:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.paymentStatus = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const payment = await Payment.findOne({ user: userId, event: eventId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for this user and event.' , hasPaid: false});
    }

    return res.status(200).json({ message: 'Payment successful. You can join the event.', hasPaid: true});

  }
  catch (e) {
    console.error('Error in paymentStatus:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 
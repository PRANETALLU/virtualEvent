const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const createPaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });
    console.log('PaymentIntent created:', paymentIntent); 
    return paymentIntent;
  } catch (error) {
    console.error('Error creating PaymentIntent:', error); 
    throw new Error(error.message);
  }
};
module.exports = { createPaymentIntent };
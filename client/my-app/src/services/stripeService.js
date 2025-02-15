const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      paymnet_method_types: ['card'],
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createPaymentIntent,
};
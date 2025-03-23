const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (amount, eventId) => {
  try {
    const YOUR_DOMAIN = process.env.YOUR_DOMAIN || 'http://localhost:5173';
     const session = await stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       line_items: [{
         price_data: {
           currency: 'usd',
           product_data: {
             name: 'Live Stream Access',
           },
           unit_amount: amount, 
         },
         quantity: 1,
       }],
       mode: 'payment',
       success_url: `${YOUR_DOMAIN}/watch/${eventId}?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${YOUR_DOMAIN}/cancel`,
      });
      console.log('Stripe Checkout session created:', session);
      return session;
    } catch (error) {
      console.error('Error creating Checkout Session:', error);
     throw new Error(error.message);
   }
 };

 module.exports = { createCheckoutSession };
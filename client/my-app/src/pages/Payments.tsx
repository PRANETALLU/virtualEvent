import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Box, Button, Typography } from '@mui/material';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  useEffect(() => {
    axios.post('http://localhost:5000/api/payments/create-payment-intent', { amount: 1000 })
      .then(({ data }) => {
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        console.error('Error fetching client secret:', err);
        setError('Failed to initialize payment.');
      });
  }, []);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card details not found.');
      setLoading(false);
      return;
    }
    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });
    if (paymentError) {
      setError(paymentError.message || 'Payment failed.');
    } else if (paymentIntent?.status === 'succeeded') {
      setSuccess(true);
    }
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Card details
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#32325d',
              letterSpacing: '0.025em',
              fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a',
            },
          },
        }} />
      </label>
      <Button type="submit" variant="contained" color="primary" disabled={!stripe || loading} sx={{ mt: 2 }}>
        {loading ? 'Processing…' : 'Pay $10.00'}
      </Button>
      {error && <Typography color="error">{error}</Typography>}
      {success && <Typography color="primary" sx={{ mt: 2 }}>Payment Successful!</Typography>}
    </form>
  );
};
const Payments: React.FC = () => (
  <Elements stripe={stripePromise}>
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Payments</Typography>
      <CheckoutForm />
    </Box>
  </Elements>
);
export default Payments;

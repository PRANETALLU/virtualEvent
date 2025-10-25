import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { Box, Grid, Typography, TextField, Button, Paper, CircularProgress, Alert } from '@mui/material';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    axios
      .post(`${API_URL}/api/payments/create-payment-intent`, { amount: 1000 })
      .then(({ data }) => {
        console.log('Client Secret received:', data.clientSecret);
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

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${firstName} ${lastName}`,
              email,
              phone,
              address: { city, postal_code: zipCode, country },
            },
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message || 'Payment failed.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        const response = await axios.post(`${API_URL}/api/payments/save-payment`, {
          stripePaymentId: paymentIntent.id,
          amount: paymentIntent.amount,
        });
        console.log('Payment saved:', response.data);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed.');
    }
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, pt: 10 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Payment Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Name on Card"
            variant="outlined"
            fullWidth
            value={`${firstName} ${lastName}`}
            onChange={(e) => {
              const [first, last] = e.target.value.split(' ');
              setFirstName(first || '');
              setLastName(last || '');
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Country or Region" variant="outlined" fullWidth value={country} onChange={(e) => setCountry(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="City" variant="outlined" fullWidth value={city} onChange={(e) => setCity(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Zip Code" variant="outlined" fullWidth value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Phone" variant="outlined" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <CardElement options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }} />
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button type="submit" variant="contained" color="primary" disabled={!stripe || loading} fullWidth>
          {loading ? (<><CircularProgress size={20} sx={{ mr: 1 }} />Processing</>) : 'Save Payment Information'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>Payment information saved successfully!</Alert>}
    </Box>
  );
};

const Payments: React.FC = () => (
  <Elements stripe={stripePromise}>
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, pt: 10 }}>
      <CheckoutForm />
    </Box>
  </Elements>
);

export default Payments;
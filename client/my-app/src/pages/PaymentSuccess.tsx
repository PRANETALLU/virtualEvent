import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Box, Paper, Typography } from '@mui/material';

// Define types for the payment data
interface Payment {
    amount: number;
    stripePaymentId: string;
    event: {
        title: string;
    };
}

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

const PaymentSuccess = () => {
    const [payment, setPayment] = useState<Payment | null>(null); // Explicitly set the type
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const location = useLocation();

    useEffect(() => {
        const fetchPaymentStatus = async () => {
            const queryParams = new URLSearchParams(location.search);
            const sessionId = queryParams.get('session_id');

            if (sessionId) {
                try {
                    const response = await axios.get(`${API_URL}/api/payments/success?session_id=${sessionId}`);
                    setPayment(response.data.payment); // Now TypeScript knows the type of 'payment'
                } catch (err) {
                    setError('Failed to confirm payment.');
                } finally {
                    setLoading(false);
                }
            } else {
                setError('No session ID found.');
                setLoading(false);
            }
        };

        fetchPaymentStatus();
    }, [location]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, width: '100%' }}>
                <Typography variant="h3" gutterBottom align="center">
                    Payment Successful!
                </Typography>
                <Typography variant="body1" align="center" sx={{ marginBottom: 2 }}>
                    You have successfully paid ${payment?.amount} for access to the event.
                </Typography>
                <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
                    Event: {payment?.event.title}
                </Typography>
                <Typography variant="body2" align="center">
                    Payment ID: {payment?.stripePaymentId}
                </Typography>
            </Paper>
        </Box>
    );
};

export default PaymentSuccess;

import { useState } from "react";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import axios from "axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/forgot-password", { email });
            setMessage(response.data.message);
        } catch (error) {
            setMessage("Error sending reset email. Please try again.");
        }
    };

    return (
        <Container maxWidth="sm" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            minWidth: "100%",
            textAlign: "center",
            padding: 3,
        }}>
            <Box sx={{ mt: 8, p: 3, boxShadow: 3, borderRadius: 2, bgcolor: "white" }}>
                <Typography variant="h5" gutterBottom>
                    Forgot Password
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Send Reset Link
                    </Button>
                </form>
                {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
            </Box>
        </Container>
    );
};

export default ForgotPassword;

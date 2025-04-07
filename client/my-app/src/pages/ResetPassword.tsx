import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import queryString from "query-string";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import axios from "axios";

const ResetPassword = () => {
  //const { token } = useParams<{ token: string }>();
  const { token } = queryString.parse(location.search);
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  console.log("Parse token", token)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/user/reset-password`, { 
        token,
        newPassword: password 
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setMessage("Invalid or expired token.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 3, boxShadow: 3, borderRadius: 2, bgcolor: "white" }}>
        <Typography variant="h5" gutterBottom>
          Reset Password
        </Typography>
        <form onSubmit={handleReset}>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Reset Password
          </Button>
        </form>
        {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
      </Box>
    </Container>
  );
};

export default ResetPassword;

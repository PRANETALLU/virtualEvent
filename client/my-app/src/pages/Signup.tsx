import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/user/signup", { email, username, password });
      navigate("/login");
    } catch (error) {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        minWidth: "100%",
        backgroundColor: "black",
        color: "white",
        textAlign: "center",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold">
          Create Account
        </Typography>
        <Typography variant="h6" color="#00cfff">
          Sign up to get started
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: 4,
          borderRadius: 2,
          width: 350,
        }}
      >
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "#00cfff" },
              "&.Mui-focused fieldset": { borderColor: "#00cfff" },
            },
          }}
        />
        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "#00cfff" },
              "&.Mui-focused fieldset": { borderColor: "#00cfff" },
            },
          }}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "#00cfff" },
              "&.Mui-focused fieldset": { borderColor: "#00cfff" },
            },
          }}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ height: 50, fontSize: 18, fontWeight: "bold" }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "SIGN UP"}
        </Button>
      </Box>
      <Typography variant="body1" mt={2}>
        Already have an account?{" "}
        <span
          style={{ color: "#00cfff", cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Log In
        </span>
      </Typography>
    </Container>
  );
};

export default Signup;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Container, Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUserInfo } = useUser();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(
        "http://localhost:5000/user/login",
        { username, password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setUserInfo({ id: data.id, username: data.username, token: data.token });
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ id: data.id, username: data.username, token: data.token })
      );
      navigate("/home");
    } catch (error) {
      setError("Invalid username or password");
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
        backgroundColor: "black",
        color: "white",
        textAlign: "center",
        padding: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: 5,
          borderRadius: 3,
          width: 380,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Typography variant="h5" fontWeight="bold">Login to Streamify</Typography>
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
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "LOG IN"}
        </Button>
      </Box>
      <Typography variant="body1" mt={3}>
        Don't have an account?{" "}
        <span
          style={{ color: "#00cfff", cursor: "pointer", fontWeight: "bold" }}
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </span>
      </Typography>
    </Container>
  );
};

export default Login;

import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ textAlign: "center", backgroundColor: "black", color: "white", minHeight: "100vh", minWidth: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, width: "100%" }}>
        <Typography variant="h1" fontWeight="bold" mb={2}>
          LIVE. <span style={{ color: "#00cfff" }}>CREATE.</span> CONNECT
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="primary" sx={{ width: 160, height: 50, fontSize: 18, fontWeight: "bold" }} onClick={() => navigate("login")}>
            LOG IN
          </Button>
          <Button variant="contained" color="primary" sx={{ width: 160, height: 50, fontSize: 18, fontWeight: "bold" }} onClick={() => navigate("signup")}>
            SIGN UP
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Welcome;
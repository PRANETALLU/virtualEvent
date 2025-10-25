import { AppBar, Toolbar, Button, Box, Avatar, Menu, MenuItem, IconButton } from "@mui/material";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

const getAvatarColor = (char: string) => {
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722"];
  return colors[char.charCodeAt(0) % colors.length];
};

const API_URL = import.meta.env.VITE_API_URL;

export const Header: React.FC = () => {
  const { userInfo, setUserInfo } = useUser();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/user/logout`, {}, { withCredentials: true });
      setUserInfo(null);
      localStorage.removeItem("userInfo");
      navigate("/");
    } catch (error) {
      console.error("Logout error", error);
    }
    handleMenuClose();
  };

  return (
    <AppBar position="fixed" color="default">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link to={userInfo ? "/home" : "/"} style={{ textDecoration: 'none' }}>
            <img src="streamifylogo.png" alt="Streamify Logo" style={{ width: 200, height: "auto" }} />
          </Link>
          <Button
            component={Link}
            to="/about"
            sx={{
              ml: 2,
              color: "#ffffff",
              textTransform: "uppercase",
              fontWeight: "bold",
              borderRadius: "25px",
              px: 3,
              py: 1,
              backgroundColor: "#3f51b5",
              "&:hover": {
                backgroundColor: "#1a237e",
              },
            }}
          >
            About
          </Button>
        </Box>
        {userInfo && (
          <Box>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: getAvatarColor(userInfo.username ? userInfo.username[0].toUpperCase() : "U") }}>
                {userInfo.username ? userInfo.username[0].toUpperCase() : "U"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigate("/profile")}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
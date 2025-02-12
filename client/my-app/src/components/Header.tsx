import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Header: React.FC = () => {
    const { userInfo, setUserInfo } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:5000/user/logout", {}, { withCredentials: true });
            setUserInfo(null);
            localStorage.removeItem("userInfo");
            navigate("/");
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <AppBar position="fixed" color="default">
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img src="streamifylogo.png" alt="Streamify Logo" style={{ width: 200, height: "auto" }} />
                </Box>
                {userInfo && (
                    <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};
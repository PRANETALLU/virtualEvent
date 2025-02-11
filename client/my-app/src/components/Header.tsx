import { Button } from "@mui/material";
import { useUser } from "../context/UserContext";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

export const Header = () => {
    const { userInfo, setUserInfo } = useUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
          await axios.post('http://localhost:5000/user/logout');
          setUserInfo(null);
          localStorage.removeItem("userInfo");
          navigate('/');
        } catch (error) {
          console.error('Logout error', error);
        }
    };

    return (
        <div>
            {userInfo && (
                <div>
                    <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>
                </div>
            )}
        </div>
    );
};
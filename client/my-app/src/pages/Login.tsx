// src/pages/Login.tsx
import {  useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUserInfo } = useUser();

  const handleLogin = async () => {
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
  
      setUserInfo({id: data.id, username: data.username, token: data.token});
      localStorage.setItem("userInfo", JSON.stringify({id: data.id, username: data.username, token: data.token}));
  
      navigate("/home");
    } catch (error) {
      console.error("Login error", error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;

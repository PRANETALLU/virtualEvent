// src/pages/Login.tsx

import React, {  useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUserInfo } = useUser();

  const handleLogin = async () => {
<<<<<<< Updated upstream
    try {
      const { data } = await axios.post('http://localhost:5000/user/login', {
        username,
        password,
      });
      setUserInfo(data); 
      navigate('/home');
=======
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Authenticate user and get token
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

      const { token, id } = data;

      // 2️⃣ Fetch full user profile using the token
      const profileResponse = await axios.get("http://localhost:5000/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userProfile = profileResponse.data;

      // 3️⃣ Store user details in Context and Local Storage
      const userInfo = { 
        id, 
        username: userProfile.username, 
        email: userProfile.email, 
        avatar: userProfile.avatar, 
        bio: userProfile.bio, 
        interests: userProfile.interests, 
        token 
      };

      setUserInfo(userInfo);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      // 4️⃣ Navigate to Home Page
      navigate("/home");

>>>>>>> Stashed changes
    } catch (error) {
      console.error('Login error', error);
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Avatar, Typography, Checkbox, FormControlLabel, Button, Paper, Box } from '@mui/material';
import { useUser } from '../context/UserContext';

const eventCategories = [
  "Music", "Arts", "Sports", "Tech", "Business", "Education",
  "Food", "Health", "Community", "Travel", "Gaming", "Other"
];

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  preferences?: string[];  // Made optional to prevent `undefined.includes()`
  interests?: string[];
};

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const { userInfo } = useUser();
  const userId = userInfo?.id; 

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API_URL}/user/${userId}`)
      .then(response => {
        setUser(response.data);
        setSelectedPreferences(response.data.preferences ?? []); // Ensure preferences is an array
      })
      .catch(error => console.error("Error fetching user data:", error));
  }, [userId]);

  const handlePreferenceChange = (preference: string) => {
    setSelectedPreferences(prev =>
      prev.includes(preference) ? prev.filter(p => p !== preference) : [...prev, preference]
    );
  };

  const savePreferences = () => {
    if (!userId) return;
    axios.put(`${API_URL}/user/${userId}/preferences`, { preferences: selectedPreferences })
      .then(response => {
        setUser(response.data.user);
        alert("Preferences updated successfully!");
      })
      .catch(error => console.error("Error updating preferences:", error));
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ paddingTop: "80px" }}>
      <Paper elevation={3} sx={{ padding: '20px', textAlign: 'center' }}>
        <Avatar src={user.avatar || "/default-avatar.png"} alt="Avatar" sx={{ width: 80, height: 80, margin: 'auto' }} />
        <Typography variant="h5" sx={{ marginTop: 2 }}>{user.username}</Typography>
        <Typography variant="body2" color="textSecondary">{user.email}</Typography>
        <Typography variant="body1" sx={{ marginTop: 1 }}>{user.bio || "No bio available."}</Typography>
        
        <Typography variant="h6" sx={{ marginTop: 3 }}>Preferences</Typography>
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          {eventCategories.map(pref => (
            <FormControlLabel
              key={pref}
              control={<Checkbox checked={selectedPreferences.includes(pref)} onChange={() => handlePreferenceChange(pref)} />}
              label={pref}
            />
          ))}
        </Box>
        <Button onClick={savePreferences} variant="contained" color="primary" sx={{ marginTop: 2 }}>
          Save Preferences
        </Button>
      </Paper>
    </Container>
  );
};

export default Profile;

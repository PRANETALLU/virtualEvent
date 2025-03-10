import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import axios from 'axios';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/notifications', { withCredentials: true })
      .then(response => {
        setNotifications(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load notifications.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Notifications
      </Typography>
      <List>
        {notifications.map((notification, index) => (
          <ListItem key={index}>
            <ListItemText primary={notification.message} secondary={new Date(notification.createdAt).toLocaleString()} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Notifications;
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  venue: string;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', price: '', venue: '' });
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useUser();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/events/create');
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/user/logout');
      setUserInfo(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { data } = await axios.post('http://localhost:5000/events/create', newEvent);
      setEvents([...events, data]);
      setOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div>
      <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>
      {userInfo && <h1>{userInfo.username}</h1>}
      
      <h1>Upcoming Events</h1>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Create Event</Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
          <TextField label="Description" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
          <TextField type="datetime-local" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
          <TextField label="Venue" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
          <TextField label="Price" type="number" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleCreateEvent} color="primary">Create</Button>
        </DialogActions>
      </Dialog>
      
      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events available at the moment.</p>
      ) : (
        <div>
          {events.map(({ _id, title, description, date, venue, price }) => (
            <div key={_id} style={styles.eventCard}>
              <h2>{title}</h2>
              <p>{description}</p>
              <p><strong>Date:</strong> {new Date(date).toLocaleString()}</p>
              <p><strong>Venue:</strong> {venue}</p>
              <p><strong>Price:</strong> ${price || 'Free'}</p>
              <Link to={`/events/${_id}`} style={styles.link}>
                <Button variant="outlined">View Details</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  eventCard: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ccc',
  },
  link: {
    textDecoration: 'none',
    color: '#007bff',
  },
};

export default Home;

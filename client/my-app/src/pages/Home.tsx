import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import EventCard from '../components/EventCard';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

interface Event {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;
  organizer: {
    _id: string;
    username: string; 
    email: string; 
  };
  liveStreamUrl?: string;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', dateTime: '', price: '', venue: '' });
  const { userInfo } = useUser();

  useEffect(() => {
    console.log('User Info', userInfo)
  }, [userInfo])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/events');
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    try {
      console.log("Pass 1")
      console.log(newEvent)
      const { data } = await axios.post('http://localhost:5000/events/create', newEvent, {withCredentials: true});
      console.log("Pass 2")
      setEvents([...events, data]);
      setOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div>
      {userInfo && <h1>{userInfo.username}</h1>}
      
      <h1>Upcoming Events</h1>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>Create Event</Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
          <TextField label="Description" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
          <TextField type="datetime-local" fullWidth margin="dense" onChange={(e) => setNewEvent({ ...newEvent, dateTime: e.target.value })} />
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
          {events.map((event) => (
            <EventCard key={event._id} {...event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import EventCard from "../components/EventCard";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
} from "@mui/material";

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

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState<{ title: string; description: string; dateTime: string; price: string; venue: string }>({
    title: "",
    description: "",
    dateTime: "",
    price: "",
    venue: "",
  });
  const { userInfo } = useUser();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/events");
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    try {
      const { data } = await axios.post("http://localhost:5000/events/create", newEvent, { withCredentials: true });
      setEvents([...events, data]);
      setOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  return (
    <Box sx={{ pt: 8, pb: 4, px: 2 }}>
      <Typography variant="h3" color="primary" align="center" gutterBottom>
        {userInfo ? `Welcome, ${userInfo.username}` : "Upcoming Events"}
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Create Event
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="dense"
            onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            type="datetime-local"
            fullWidth
            margin="dense"
            onChange={(e) => setNewEvent((prev) => ({ ...prev, dateTime: e.target.value }))}
          />
          <TextField
            label="Venue"
            fullWidth
            margin="dense"
            onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
          />
          <TextField
            label="Price"
            type="number"
            fullWidth
            margin="dense"
            onChange={(e) => setNewEvent((prev) => ({ ...prev, price: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreateEvent} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <Typography variant="h6" align="center">Loading events...</Typography>
      ) : events.length === 0 ? (
        <Typography variant="h6" align="center">No events available at the moment.</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {events.map((event) => (
            <Box key={event._id} sx={{ width: "100%", maxWidth: "320px" }}>
              <EventCard {...event} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Home;

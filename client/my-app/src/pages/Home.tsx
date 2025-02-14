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
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

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
  ended: boolean;
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

  // Categorize events
  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.dateTime) > now && !event.ended);
  const inProgressEvents = events.filter((event) => new Date(event.dateTime) <= now && !event.ended);
  const completedEvents = events.filter((event) => event.ended);

  return (
    <Box sx={{ pt: 8, pb: 4, px: 2, my: 4, display: "flex", flexDirection: "column", alignItems: "center"}}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%", maxWidth: "900px", mb: 3 }}>
        <Typography variant="h3" color="primary">
          Welcome {userInfo?.username}!
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)} startIcon={<AddIcon />}>
          Create Event
        </Button>
      </Stack>

      {/* Event Creation Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="dense" onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))} />
          <TextField label="Description" fullWidth margin="dense" onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))} />
          <TextField type="datetime-local" fullWidth margin="dense" onChange={(e) => setNewEvent((prev) => ({ ...prev, dateTime: e.target.value }))} />
          <TextField label="Venue" fullWidth margin="dense" onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))} />
          <TextField label="Price" type="number" fullWidth margin="dense" onChange={(e) => setNewEvent((prev) => ({ ...prev, price: e.target.value }))} />
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

      {/* Loading and No Events Message */}
      {loading ? (
        <Typography variant="h6" align="center">Loading events...</Typography>
      ) : (
        <>
          {["Upcoming Events", "In Progress Events", "Completed Events"].map((category, index) => {
            const eventLists = [upcomingEvents, inProgressEvents, completedEvents];
            const eventColors = ["primary", "secondary", "textSecondary"];
            const eventsInCategory = eventLists[index];

            return (
              <Box key={category} sx={{ mt: 4, textAlign: "center", width: "100%" }}>
                <Typography variant="h4" color={eventColors[index]} gutterBottom>
                  {category}
                </Typography>
                {eventsInCategory.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
                    {eventsInCategory.map((event) => (
                      <Box key={event._id} sx={{ width: "100%", maxWidth: "320px" }}>
                        <EventCard {...event} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="h6" color="textSecondary">
                    No events available.
                  </Typography>
                )}
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};

export default Home;

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

interface Attendee {
  _id: string;
  username: string;
  email: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;
  category: string;
  organizer: {
    _id: string;
    username: string;
    email: string;
  };
  attendees: Attendee[];
  liveStreamUrl?: string;
  ended: boolean;
}

const eventCategories = [
  "Music", "Arts", "Sports", "Tech", "Business", "Education",
  "Food", "Health", "Community", "Travel", "Gaming", "Other"
];

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<boolean>(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    dateTime: "",
    price: "",
    venue: "",
    category: "",
  });
  const { userInfo } = useUser();
  const navigate = useNavigate();

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
      setEvents([...events, data.event]);
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleDeleteEvent = async (deletedEventId: string) => {
    try {
      await axios.delete(`http://localhost:5000/events/${deletedEventId}`, { withCredentials: true });
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== deletedEventId));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const now = new Date();
  const yourEvents = events.filter((event) => event.organizer._id == userInfo?.id && !event.ended);
  const upcomingEvents = events.filter((event) => new Date(event.dateTime) > now && event.attendees.some(attendee => attendee._id === userInfo?.id) && !event.ended);   // Upcoming events to attend
  const inProgressEvents = events.filter((event) => new Date(event.dateTime) <= now && event.attendees.some(attendee => attendee._id === userInfo?.id) && !event.ended); // Events to attend on time
  const completedEvents = events.filter((event) => (event.organizer._id === userInfo?.id || event.attendees.some(attendee => attendee._id === userInfo?.id)) && event.ended); // Attended events that are completed and also events that are created

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      pt: { xs: 4, md: 6 },
      pb: 8,
      marginTop: 10
    }}>
      <Box sx={{
        maxWidth: '1200px',
        mx: 'auto',
        px: { xs: 2, sm: 4 }
      }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 6,
          gap: 2
        }}>
          <Typography
            variant="h3"
            color="primary"
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            Welcome {userInfo?.username}!
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            {/*<Button
              onClick={() => navigate("/lStream")}
              color="primary"
              variant="contained"
              sx={{ minWidth: '100px' }}
            >
              LStream
            </Button>*/}
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                minWidth: '160px',
                height: '48px'
              }}
            >
              Create Event
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/search")}
              sx={{
                minWidth: '160px',
                height: '48px'
              }}
            >
              Search Events
            </Button>
          </Stack>
        </Box>

        {/* Event Creation Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Create New Event
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Title"
                fullWidth
                variant="outlined"
                onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
              />
              <TextField
                type="datetime-local"
                fullWidth
                variant="outlined"
                onChange={(e) => setNewEvent((prev) => ({ ...prev, dateTime: e.target.value }))}
              />
              <TextField
                label="Venue"
                fullWidth
                variant="outlined"
                onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
              />
              <TextField
                label="Price"
                type="number"
                fullWidth
                variant="outlined"
                onChange={(e) => setNewEvent((prev) => ({ ...prev, price: e.target.value }))}
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  {eventCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{ minWidth: '100px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              color="primary"
              variant="contained"
              sx={{ minWidth: '100px' }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Events Sections */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6">Loading events...</Typography>
          </Box>
        ) : (
          <Stack spacing={8}>
            {[
              { title: "Your Events", events: yourEvents, color: "primary" },
              { title: "Upcoming Events", events: upcomingEvents, color: "success" },
              { title: "In Progress Events", events: inProgressEvents, color: "secondary" },
              { title: "Completed Events", events: completedEvents, color: "text.secondary" }
            ].map(({ title, events, color }) => (
              <Box key={title}>
                <Typography
                  variant="h4"
                  color={color}
                  sx={{
                    mb: 4,
                    fontWeight: 'bold',
                    textAlign: { xs: 'left', sm: 'center' }
                  }}
                >
                  {title}
                </Typography>
                {events.length > 0 ? (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)'
                    },
                    gap: 3
                  }}>
                    {events.map((event) => (
                      <Box key={event._id}>
                        <EventCard {...event} onDelete={handleDeleteEvent} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      textAlign: 'center',
                      py: 4
                    }}
                  >
                    No events available.
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Home;
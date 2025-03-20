import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Container, Typography, Paper, CircularProgress, Box, Button, List, ListItem, Divider } from "@mui/material";

interface Attendee {
  _id: string;
  username: string;
  email: string;
}

interface EventDetails {
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

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/events/${eventId}`);
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h5" color="error">
          Event not found!
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 18, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h3" color="primary" gutterBottom>
          {event.title}
        </Typography>

        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
          {event.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <strong>Date:</strong> {new Date(event.dateTime).toLocaleString()}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <strong>Venue:</strong> {event.venue}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <strong>Price:</strong> {event.price ? `$${event.price}` : "Free"}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <strong>Category:</strong> {event.category}
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          <strong>Attendees:</strong>
        </Typography>
        <List sx={{ mb: 3 }}>
          {event.attendees.length > 0 ? (
            event.attendees.map((attendee) => (
              <ListItem key={attendee._id}>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                  {attendee.username} ({attendee.email})
                </Typography>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No attendees yet.
              </Typography>
            </ListItem>
          )}
        </List>

        {event.liveStreamUrl && (
          <Box mt={3} textAlign="center">
            <Typography variant="h5" color="secondary" gutterBottom>
              Live Streaming
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href={event.liveStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 1 }}
            >
              Watch Live Stream
            </Button>
          </Box>
        )}

        {event.ended && (
          <Box mt={4} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              This event has ended.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EventDetails;

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Container, Typography, Paper, CircularProgress, Box, Button } from "@mui/material";

interface EventDetails {
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;
  attendees: string[];
  liveStreamUrl?: string;
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
        <Typography variant="body1" paragraph>
          {event.description}
        </Typography>
        <Typography variant="h6">
          <strong>Date:</strong> {new Date(event.dateTime).toLocaleString()}
        </Typography>
        <Typography variant="h6">
          <strong>Venue:</strong> {event.venue}
        </Typography>
        <Typography variant="h6">
          <strong>Price:</strong> {event.price ? `$${event.price}` : "Free"}
        </Typography>
        <Typography variant="h6">
          <strong>Attendees:</strong> {event.attendees.length}
        </Typography>

        {event.liveStreamUrl && (
          <Box mt={3} textAlign="center">
            <Typography variant="h5" color="secondary">
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
      </Paper>
    </Container>
  );
};

export default EventDetails;

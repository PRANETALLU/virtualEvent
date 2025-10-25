import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Box,
  Button,
  List,
  ListItem,
} from "@mui/material";
import { useUser } from "../context/UserContext";

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

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userHasPaid, setUserHasPaid] = useState<boolean>(false);
  const { userInfo } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/events/${eventId}`);
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!eventId || !event || event.price === 0 || 
          (userInfo && userInfo.id === event.organizer._id)) return;
      
      try {
        const response = await axios.get(
          `${API_URL}/events/${eventId}/payment-status`,
          { withCredentials: true }
        );
        setUserHasPaid(response.data.hasPaid);
      } catch (error) {
        console.error("Error checking payment status:", error);
        setUserHasPaid(false);
      }
    };
    
    if (event) {
      checkPaymentStatus();
    }
  }, [eventId, event, userInfo]);

  const handleUnlockLivestream = async () => {
    if (!event) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/payments/create-checkout-session`,
        { amount: event.price * 100, eventId: event._id },
        { withCredentials: true }
      );
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error unlocking livestream:", error);
    }
  };

  const accessLiveStream = () => {
    if (!eventId) return;
    navigate(`/watch/${eventId}`);
  };

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

  const isOrganizer = userInfo && userInfo.id === event.organizer?._id;

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
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <strong>Organizer:</strong> {event.organizer?.username}
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

        {event.liveStreamUrl && (isOrganizer || event.price === 0 || userHasPaid) ? (
          <Box mt={3} textAlign="center">
            <Typography variant="h5" color="secondary" gutterBottom>
              Live Streaming
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={accessLiveStream}
              sx={{ mt: 1 }}
            >
              Watch Live Stream
            </Button>
          </Box>
        ) : (
          !event.ended && event.price > 0 && !isOrganizer && !userHasPaid && (
            <Box mt={3} textAlign="center">
              <Typography variant="h5" color="warning" gutterBottom>
                Unlock the Livestream
              </Typography>
              <Button
                variant="contained"
                color="warning"
                onClick={handleUnlockLivestream}
                sx={{ mt: 1 }}
              >
                Unlock Livestream for ${event.price}
              </Button>
            </Box>
          )
        )}

        {event.ended && (
          <Box mt={4} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              This event has ended.
            </Typography>
            {(event.price === 0 || userHasPaid) && event.liveStreamUrl && (
              <Button
                variant="contained"
                color="primary"
                onClick={accessLiveStream}
                sx={{ mt: 2 }}
              >
                Watch Recording
              </Button>
            )}
            {event.price > 0 && !userHasPaid && !isOrganizer && (
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleUnlockLivestream}
                >
                  Access Recording for ${event.price}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EventDetails;
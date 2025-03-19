import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Box,
  Button,
  List,
  ListItem,
  Divider,
} from "@mui/material";

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

const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasPaid, setHasPaid] = useState(false);

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

  const handleWatchLive = async () => {
    if (event.price > 0) {
      if (!hasPaid) {
        const amountInCents = Math.round(event.price * 100);
        try {
          const response = await axios.post("http://localhost:5000/api/payments/create-checkout-session", {
            amount: amountInCents,
            eventId: event._id,
          });
          if (response.data.url) {
            window.location.href = response.data.url;
          }
        } catch (error) {
          console.error("Error creating checkout session:", error);
        }
      } else {
        window.open(event.liveStreamUrl, "_blank");
      }
    } else if (event.liveStreamUrl) {
      window.open(event.liveStreamUrl, "_blank");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 18, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h3" color="primary" gutterBottom>
          {event.title}
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontSize: "1.1rem", color: "text.secondary" }}>
          {event.description}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Date: {new Date(event.dateTime).toLocaleString()}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Venue: {event.venue}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Price: {event.price > 0 ? `$${event.price}` : "Free"}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Category: {event.category}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold", mt: 2 }}>
          Attendees:
        </Typography>
        <List>
          {event.attendees.length > 0 ? (
            event.attendees.map((attendee) => (
              <ListItem key={attendee._id}>
                <Typography variant="body1">
                  {attendee.username} ({attendee.email})
                </Typography>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
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
            {event.price > 0 ? (
              hasPaid ? (
                <Button variant="contained" color="primary" onClick={handleWatchLive} sx={{ mt: 1 }}>
                  Watch Live Stream
                </Button>
              ) : (
                <Button variant="contained" color="primary" onClick={handleWatchLive} sx={{ mt: 1 }}>
                  Pay to Unlock Live Stream
                </Button>
              )
            ) : (
              <Button variant="contained" color="primary" onClick={handleWatchLive} sx={{ mt: 1 }}>
                Watch Live Stream
              </Button>
            )}
          </Box>
        )}
        {event.ended && (
          <Box mt={4} sx={{ textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              This event has ended.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EventDetailsPage;
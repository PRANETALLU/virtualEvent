import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { DeleteOutline, Edit, MoreVert } from "@mui/icons-material";

interface Attendee {
  _id: string;
  username: string;
  email: string;
}

interface EventProps {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;       
  category: string;
  organizer: {
    _id: string;
    username?: string;
    email: string;
  };
  attendees: Attendee[];
  liveStreamUrl?: string;
  ended: boolean;
  onDelete: (deletedEventId: string) => void;
}

const eventCategories = [
  "Music",
  "Arts",
  "Sports",
  "Tech",
  "Business",
  "Education",
  "Food",
  "Health",
  "Community",
  "Travel",
  "Gaming",
  "Other",
];

const EventCard: React.FC<EventProps> = ({
  _id,
  title,
  description,
  dateTime,
  venue,
  price,
  category,
  organizer,
  attendees,
  liveStreamUrl,
  ended,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { userInfo } = useUser();
  const [isAttending, setIsAttending] = useState(
    attendees.some((attendee) => attendee._id === userInfo?.id)
  );
  const isOrganizer = organizer._id === userInfo?.id;
  const [hasPaid, setHasPaid] = useState(false);
  const handleJoinLive = async () => {
    const amountInCents = Math.round(price * 100);
    try {
      const response = await axios.post("http://localhost:5000/api/payments/create-checkout-session", {
        amount: amountInCents,
        eventId: _id,
      });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };
  const handleJoinEvent = async () => {
    if (!_id || isAttending) return;
    try {
      const response = await axios.post(`http://localhost:5000/events/${_id}/attendees`, {}, { withCredentials: true });
      if (response.status === 200) {
        setIsAttending(true);
      }
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };
  const startLivestream = async () => {
    try {
      await axios.post(`http://localhost:5000/events/${_id}/livestream/start`, {}, { withCredentials: true });
      navigate(`/watch/${_id}`);
    } catch (error) {
      console.error("Error starting livestream:", error);
    }
  };

  const styles = {
    eventCard: {
      margin: "16px",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    },
    cardContent: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "12px",
    },
    link: {
      textDecoration: "none",
    },
  };

  return (
    <Card style={styles.eventCard}>
      <CardContent style={styles.cardContent}>
        <div style={styles.header}>
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
          {isOrganizer && (
            <>
              <IconButton onClick={() => { /* menu open logic */ }}>
                <MoreVert />
              </IconButton>
            </>
          )}
        </div>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {description}
        </Typography>
        <Typography variant="body2">
          <strong>Date:</strong> {new Date(dateTime).toLocaleString()}
        </Typography>
        <Typography variant="body2">
          <strong>Venue:</strong> {venue}
        </Typography>
        <Typography variant="body2">
          <strong>Organizer:</strong> {organizer.username}
        </Typography>
        <Typography variant="body2">
          <strong>Category:</strong> {category}
        </Typography>
        <Typography variant="body2">
          <strong>Price:</strong> {price > 0 ? `$${price}` : "Free"}
        </Typography>
        <div style={styles.buttonGroup}>
          <Link to={`/events/${_id}`} style={styles.link}>
            <Button variant="outlined">View Details</Button>
          </Link>
          {liveStreamUrl && !ended && (
            price > 0 ? (
              hasPaid ? (
                <a href={liveStreamUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  <Button variant="contained" color="primary">
                    Join Live
                  </Button>
                </a>
              ) : (
                <Button variant="contained" color="primary" onClick={handleJoinLive}>
                  Pay to Unlock Live
                </Button>
              )
            ) : (
              <a href={liveStreamUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                <Button variant="contained" color="primary">
                  Join Live
                </Button>
              </a>
            )
          )}
        </div>
        {!isAttending && !isOrganizer && !ended && (
          <Button variant="contained" color="success" onClick={handleJoinEvent} fullWidth>
            Join Event
          </Button>
        )}
        {isAttending && !isOrganizer && !ended && (
          <Button variant="contained" disabled fullWidth>
            Attending
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
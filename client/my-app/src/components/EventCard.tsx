import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { DeleteOutline } from "@mui/icons-material";

interface Attendee {
  _id: string;
  username: string;
  email: string;
}

interface EventProps {
  _id?: string;
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

const EventCard = ({ _id, title, description, dateTime, venue, price, category, organizer, attendees, liveStreamUrl, ended, onDelete }: EventProps) => {
  const navigate = useNavigate();
  const { userInfo } = useUser();
  const [isAttending, setIsAttending] = useState(attendees.some((attendee) => attendee._id === userInfo?.id));

  const isOrganizer = organizer?._id === userInfo?.id;

  const [openDialog, setOpenDialog] = useState(false);

  const startLivestream = async () => {
    try {
      await axios.post(`http://localhost:5000/events/${_id}/livestream/start`, {}, { withCredentials: true });
      navigate(`/watch/${_id}`);
    } catch (error) {
      console.error("Error starting livestream:", error);
    }
  };

  const handleDelete = async () => {
    if (_id) {
      try {
        onDelete(_id);
        setOpenDialog(false);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
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

  const handleDialogClose = () => {
    setOpenDialog(false);
  }
  const handleDialogOpen = () => setOpenDialog(true);

  return (
    <Card style={styles.eventCard}>
      <CardContent style={styles.cardContent}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        {userInfo?.id === organizer._id && (
          <IconButton onClick={handleDialogOpen} color="error" style={styles.deleteButton}>
            <DeleteOutline />
          </IconButton>
        )}
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
        <Typography variant="body2">
          <strong>Date:</strong> {new Date(dateTime).toLocaleString()}
        </Typography>
        <Typography variant="body2">
          <strong>Venue:</strong> {venue}
        </Typography>
        <Typography variant="body2">
          <strong>Organizer:</strong> {organizer?.username}
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

          {liveStreamUrl ? (
            <a href={liveStreamUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              <Button variant="contained" color="primary">
                Join Live
              </Button>
            </a>
          ) : (
            userInfo?.id === organizer._id && !ended && (
              <Button variant="contained" color="secondary" onClick={startLivestream}>
                Start Stream
              </Button>
            )
          )}
        </div>

        {!isAttending && !isOrganizer && !ended && (
          <Button variant="contained" color="success" onClick={handleJoinEvent}>
            Join Event
          </Button>
        )}

        {isAttending && !isOrganizer && !ended && (
          <Button variant="contained" disabled>
            Already Joined
          </Button>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

const styles = {
  eventCard: {
    marginBottom: "20px",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
    position: "relative" as "relative",
  },
  cardContent: {
    position: "relative" as "relative",
  },
  deleteButton: {
    position: "absolute" as "absolute",
    top: "10px",
    right: "10px",
  },
  link: {
    textDecoration: "none",
    marginRight: "10px",
  },
  buttonGroup: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
};

export default EventCard;

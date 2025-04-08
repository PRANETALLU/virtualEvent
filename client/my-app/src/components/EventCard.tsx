import { useState, useEffect } from "react";
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

const EventCard = ({
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
}: EventProps) => {
  const navigate = useNavigate();
  const { userInfo } = useUser();
  const [isAttending, setIsAttending] = useState(
    attendees.some((attendee) => attendee._id === userInfo?.id)
  );
  const isOrganizer = organizer?._id === userInfo?.id;
  const [userHasPaid, setUserHasPaid] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedEvent, setEditedEvent] = useState({
    title,
    description,
    dateTime,
    venue,
    price,
    category,
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!_id || price === 0 || isOrganizer) return;
      
      try {
        const response = await axios.get(
          `http://localhost:5000/events/${_id}/payment-status`,
          { withCredentials: true }
        );
        setUserHasPaid(response.data.hasPaid);
      } catch (error) {
        console.error("Error checking payment status:", error);
        setUserHasPaid(false);
      }
    };
    
    checkPaymentStatus();
  }, [_id, price, isOrganizer, userInfo?.id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditOpen = () => {
    setEditedEvent({ title, description, dateTime, venue, price, category });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleEditClose = () => setOpenEditDialog(false);

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:5000/events/${_id}`, editedEvent, {
        withCredentials: true,
      });
      setOpenEditDialog(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating event:", error);
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
      const response = await axios.post(
        `http://localhost:5000/events/${_id}/attendees`,
        {},
        { withCredentials: true }
      );

      if (response.status === 200) {
        setIsAttending(true);
      }
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const startLivestream = async () => {
    try {
      await axios.post(
        `http://localhost:5000/events/${_id}/livestream/start`,
        {},
        { withCredentials: true }
      );
      navigate(`/watch/${_id}`);
    } catch (error) {
      console.error("Error starting livestream:", error);
    }
  };

  const handleUnlockLivestream = async () => {
    try {
      const response1 = await axios.post(
        `http://localhost:5000/events/${_id}/attendees`,
        {},
        { withCredentials: true }
      );

      if (response1.status === 200) {
        setIsAttending(true);
      }
      const response = await axios.post(
        `http://localhost:5000/api/payments/create-checkout-session`,
        { amount: price * 100, eventId: _id },
        { withCredentials: true }
      );
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error unlocking livestream:", error);
    }
  };

  const formatDateTimeLocal = (isoString: any) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };


  const accessLiveStream = () => {
    if (!_id) return;
    navigate(`/watch/${_id}`);
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
              <IconButton onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditOpen}>
                  <Edit fontSize="small" style={{ marginRight: 8 }} />
                  Edit
                </MenuItem>
                <MenuItem
                  onClick={() => setOpenDialog(true)}
                  style={{ color: "red" }}
                >
                  <DeleteOutline fontSize="small" style={{ marginRight: 8 }} />
                  Delete
                </MenuItem>
              </Menu>
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

          {liveStreamUrl && (isOrganizer || price === 0 || userHasPaid) ? (
            <Button 
              variant="contained" 
              color="primary"
              onClick={accessLiveStream}
            >
              Join Live
            </Button>
          ) : (
            isOrganizer &&
            !ended && (
              <Button
                variant="contained"
                color="secondary"
                onClick={startLivestream}
              >
                Start Stream
              </Button>
            )
          )}
          {!isOrganizer && price > 0 && !userHasPaid && !ended && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleUnlockLivestream}
            >
              Unlock Livestream
            </Button>
          )}
        </div>
        {!isAttending &&
          !isOrganizer &&
          !ended &&
          (price === 0 || userHasPaid) && (
            <Button
              variant="contained"
              color="success"
              onClick={handleJoinEvent}
              fullWidth
            >
              Join Event
            </Button>
          )}
      </CardContent>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="dense"
            value={editedEvent.title}
            onChange={(e) =>
              setEditedEvent({ ...editedEvent, title: e.target.value })
            }
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            multiline
            value={editedEvent.description}
            onChange={(e) =>
              setEditedEvent({ ...editedEvent, description: e.target.value })
            }
          />
          <TextField
            label="Date"
            fullWidth
            margin="dense"
            type="datetime-local"
            value={formatDateTimeLocal(editedEvent.dateTime)}
            onChange={(e) =>
              setEditedEvent({ ...editedEvent, dateTime: e.target.value })
            }
          />
          <TextField
            label="Venue"
            fullWidth
            margin="dense"
            value={editedEvent.venue}
            onChange={(e) =>
              setEditedEvent({ ...editedEvent, venue: e.target.value })
            }
          />
          <TextField
            label="Price"
            fullWidth
            margin="dense"
            type="number"
            value={editedEvent.price}
            onChange={(e) =>
              setEditedEvent({ ...editedEvent, price: Number(e.target.value) })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={editedEvent.category}
              onChange={(e) =>
                setEditedEvent({ ...editedEvent, category: e.target.value })
              }
            >
              {eventCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
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

export default EventCard;
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography } from '@mui/material';
import axios from 'axios';
import { useUser } from '../context/UserContext';

interface EventProps {
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

const EventCard = ({ _id, title, description, dateTime, venue, price, organizer, liveStreamUrl }: EventProps) => {
  const navigate = useNavigate();
  const { userInfo } = useUser();
  
  const startLivestream = async () => {
    const eventId = _id; 
    try {
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/start`, {}, {withCredentials: true});
      navigate(`/watch/${eventId}`);
    } catch (error) {
      console.error('Error starting livestream:', error);
    }
  };

  return (
    <Card style={styles.eventCard}>
      <CardContent>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="textSecondary">{description}</Typography>
        <Typography variant="body2"><strong>Date:</strong> {new Date(dateTime).toLocaleString()}</Typography>
        <Typography variant="body2"><strong>Venue:</strong> {venue}</Typography>
        <Typography variant="body2"><strong>Organizer:</strong> {organizer.username}</Typography>
        <Typography variant="body2"><strong>Price:</strong> {price > 0 ? `$${price}` : 'Free'}</Typography>

        <div style={styles.buttonGroup}>
          <Link to={`/events/${_id}`} style={styles.link}>
            <Button variant="outlined">View Details</Button>
          </Link>

          {liveStreamUrl ? (
            <a href={liveStreamUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              <Button variant="contained" color="primary">Join Live</Button>
            </a>
          ) : (
            userInfo?.id === organizer._id && (
              <Button variant="contained" color="secondary" onClick={startLivestream}>
                Start Stream
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const styles = {
  eventCard: {
    marginBottom: '20px',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
  },
  link: {
    textDecoration: 'none',
    marginRight: '10px',
  },
  buttonGroup: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
  },
};

export default EventCard;

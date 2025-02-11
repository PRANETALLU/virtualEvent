import { Link } from 'react-router-dom';
import { Button } from '@mui/material';

interface EventProps {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;
}

const EventCard = ({ _id, title, description, dateTime, venue, price }: EventProps) => {
  return (
    <div style={styles.eventCard}>
      <h2>{title}</h2>
      <p>{description}</p>
      <p><strong>Date:</strong> {new Date(dateTime).toLocaleString()}</p>
      <p><strong>Venue:</strong> {venue}</p>
      <p><strong>Price:</strong> ${price || 'Free'}</p>
      <Link to={`/events/${_id}`} style={styles.link}>
        <Button variant="outlined">View Details</Button>
      </Link>
    </div>
  );
};

const styles = {
  eventCard: {
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  link: {
    textDecoration: 'none',
    color: '#007bff',
  },
};

export default EventCard;

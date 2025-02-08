// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  venue: string;
}

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch events from the backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/events');
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div>
      <h1>Upcoming Events</h1>
      {events.length === 0 ? (
        <p>No events available at the moment.</p>
      ) : (
        <div>
          {events.map((event) => (
            <div key={event._id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
              <p><strong>Venue:</strong> {event.venue}</p>
              <p><strong>Price:</strong> ${event.price || 'Free'}</p>
              <Link to={`/events/${event._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                <button>View Details</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

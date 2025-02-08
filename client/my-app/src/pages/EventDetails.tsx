// src/pages/EventDetails.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface EventDetails {
  title: string;
  description: string;
  date: string;
  venue: string;
  price: number;
  attendees: string[];
  liveStreamUrl: string;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/events/${eventId}`);
        setEvent(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return <div>Loading event details...</div>;
  }

  if (!event) {
    return <div>Event not found!</div>;
  }

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
      <p><strong>Venue:</strong> {event.venue}</p>
      <p><strong>Price:</strong> ${event.price || 'Free'}</p>
      <p><strong>Attendees:</strong> {event.attendees.length}</p>

      {event.liveStreamUrl && (
        <div>
          <h3>Live Streaming</h3>
          <a href={event.liveStreamUrl} target="_blank" rel="noopener noreferrer">
            Click here to watch the live stream
          </a>
        </div>
      )}
    </div>
  );
};

export default EventDetails;

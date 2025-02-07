import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Replace with your backend URL

const Chat = ({ eventId }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    // Join the event chat room when the component mounts
    socket.emit('joinEventChat', eventId);

    // Listen for incoming chat messages specific to this event
    socket.on('chatMessage', (msg) => {
      setChatMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('chatMessage');
    };
  }, [eventId]);

  const sendMessage = () => {
    socket.emit('chatMessage', message, eventId); // Send message to the event's chat room
    setMessage('');
  };

  return (
    <div>
      <h3>Chat for Event {eventId}</h3>
      <div>
        {chatMessages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input 
        type="text" 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        placeholder="Type your message..." 
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;

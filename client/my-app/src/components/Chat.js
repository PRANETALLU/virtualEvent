import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ChatRoom = ({ eventId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('User'); // You can set this dynamically

  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    // Join event-specific chat room
    socket.emit('join_event', eventId);

    // Listen for incoming messages
    socket.on('receive_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup when component unmounts
    return () => {
      socket.disconnect();
    };
  }, [eventId]);

  const sendMessage = () => {
    const socket = io('http://localhost:5000');
    socket.emit('send_message', { eventId, message, username });
    setMessage(''); // Clear input after sending
  };

  return (
    <div>
      <div>
        <h2>Event Chat</h2>
        <div>
          {messages.map((msg, index) => (
            <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
          ))}
        </div>
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

export default ChatRoom;

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  username: string;
  message: string;
}

interface ChatRoomProps {
  eventId: string;
}

const Chat: React.FC<ChatRoomProps> = ({ eventId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [username, setUsername] = useState<string>("User");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket: Socket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    // Join event-specific chat room
    newSocket.emit("join_event", eventId);

    // Listen for incoming messages
    newSocket.on("receive_message", (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup when component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [eventId]);

  const sendMessage = () => {
    if (socket && message.trim() !== "") {
      socket.emit("send_message", { eventId, message, username });
      setMessage(""); // Clear input after sending
    }
  };

  return (
    <div>
      <div>
        <h2>Event Chat</h2>
        <div>
          {messages.map((msg, index) => (
            <p key={index}>
              <strong>{msg.username}:</strong> {msg.message}
            </p>
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

export default Chat;

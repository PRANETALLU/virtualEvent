// Chat.tsx
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { io, Socket } from "socket.io-client";
import { Box, TextField, Button, Typography, List, ListItem } from "@mui/material";
import { useUser } from "../context/UserContext";

interface ChatMessage {
  sender: string;
  message: string;
  createdAt: number;
}

interface ChatProps {
  eventId: string;
}

const SOCKET_URL = "http://localhost:5000";

const Chat: React.FC<ChatProps> = ({ eventId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {userInfo} = useUser(); 

  // Initialize socket and join event room
  useEffect(() => {
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    socketInstance.emit("join-event", eventId);

    socketInstance.on("previous-messages", (prevMessages: ChatMessage[]) => {
      setMessages(prevMessages);
    });

    socketInstance.on("new-message", (message: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [eventId]);

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData: ChatMessage = {
        sender: userInfo?.username || "User", // Replace with actual user info (e.g., from context or props)
        message: newMessage.trim(),
        createdAt: Date.now(),
      };
      socket.emit("send-message", { eventId, message: messageData });
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        width: 350,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderLeft: "1px solid #ccc",
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{paddingLeft: 2, paddingTop: 2}}>
        Live Event Chat
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index}>
              <strong>{msg.sender}: </strong> {msg.message}
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="contained" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;

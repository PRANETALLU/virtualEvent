import { useState, useEffect, useRef, KeyboardEvent } from "react";
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

const WS_URL = "ws://localhost:5000/ws";

const Chat: React.FC<ChatProps> = ({ eventId }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userInfo } = useUser();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      setSocket(ws);

      ws.send(
        JSON.stringify({
          type: "join-room",
          eventId: eventId,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "room-joined") {
        console.log(`Joined event ${data.eventId}`);
      } else if (data.type === "chat-message") {
        // Prevent duplicate message display
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg.createdAt === data.message.createdAt)) {
            return [...prevMessages, data.message];
          }
          return prevMessages;
        });
      } else if (data.type === "previous-messages") {
        setMessages(data.messages);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket && connected) {
      const messageData: ChatMessage = {
        sender: userInfo?.username || "User",
        message: newMessage.trim(),
        createdAt: Date.now(),
      };

      // Send message to the server
      socket.send(
        JSON.stringify({
          type: "chat-message",
          eventId: eventId,
          message: messageData,
        })
      );

      setNewMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      <Typography variant="h6" fontWeight="bold" sx={{ paddingLeft: 2, paddingTop: 2 }}>
        Live Event Chat
        {!connected && (
          <Typography variant="caption" color="error" sx={{ display: "block" }}>
            Connecting...
          </Typography>
        )}
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto", mb: 2, p: 2 }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 0",
              }}
            >
              <Typography component="div" sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                {msg.sender}
              </Typography>
              <Typography component="div" sx={{ wordBreak: "break-word" }}>
                {msg.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Typography>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ display: "flex", gap: 1, p: 2, pt: 0 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!connected}
        />
        <Button variant="contained" onClick={handleSendMessage} disabled={!connected}>
          Send
        </Button>
      </Box>
    </>

  );
};

export default Chat;

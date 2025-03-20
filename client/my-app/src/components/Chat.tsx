import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Box, TextField, Button, Typography, List, ListItem, IconButton, CircularProgress } from "@mui/material";
import { useUser } from "../context/UserContext";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

interface ChatMessage {
  sender: string;
  message: string;
  createdAt: number;
  fileAttachment?: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
}

interface ChatProps {
  eventId: string;
}

const WS_URL = "ws://localhost:5000/ws";
const API_URL = "http://localhost:5000"; // Base API URL for file uploads

const Chat: React.FC<ChatProps> = ({ eventId }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileToUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file); // Converts file to base64
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64FileContent = (reader.result as string).split(",")[1]; // Extract Base64 content

          const response = await fetch(`${API_URL}/upload-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64FileContent, // Send Base64 content
              eventId: eventId,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("File upload failed");
          }

          const data = await response.json();
          resolve(data.fileUrl);
        } catch (error) {
          console.error("Error uploading file:", error);
          alert("File upload failed. Please try again.");
          reject(error);
        }
      };

      reader.onerror = () => {
        alert("Failed to read file");
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file); // Read file as Base64
    });
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() || fileToUpload) && socket && connected) {
      try {
        // If there's a file to upload, upload it first
        let fileAttachment = undefined;
        if (fileToUpload) {
          console.log(fileToUpload, fileToUpload.name, fileToUpload.type, fileToUpload.size)
          setIsUploading(true);
          try {
            const fileUrl = await uploadFile(fileToUpload);
            console.log('File URL', fileUrl)
            fileAttachment = {
              name: fileToUpload.name,
              type: fileToUpload.type,
              size: fileToUpload.size,
              url: fileUrl
            };
          } catch (error) {
            console.error("File upload failed:", error);
            setIsUploading(false);
            return;
          }
        }

        const messageData: ChatMessage = {
          sender: userInfo?.username || "User",
          message: newMessage.trim(),
          createdAt: Date.now(),
          fileAttachment
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
        setFileToUpload(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /*const handleDownloadFile = (fileUrl: string, fileName: string) => {
    console.log("File Downloading:", fileName)
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };*/

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(`${API_URL}/download-file/${eventId}/${fileName}`, {
        method: "GET",
        credentials: "include", // Ensure proper session handling if needed
      });
  
      if (!response.ok) {
        throw new Error("File download failed");
      }
  
      const blob = await response.blob(); // Convert response to a binary object
      const blobUrl = URL.createObjectURL(blob); // Create a temporary object URL
  
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Cleanup the blob URL to free memory
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
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
              {msg.fileAttachment && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography noWrap variant="body2" fontWeight="medium">
                      {msg.fileAttachment.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(msg.fileAttachment.size)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadFile(msg.fileAttachment!.url, msg.fileAttachment!.name)}
                  >
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Typography>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {fileToUpload && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            p: 1,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            width: '100%'
          }}>
            <Typography noWrap sx={{ flex: 1 }} variant="body2">
              {fileToUpload.name} ({formatFileSize(fileToUpload.size)})
            </Typography>
            <Button size="small" color="error" onClick={handleRemoveFile}>
              Remove
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, p: 2, pt: 0 }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="file-input"
        />
        <IconButton
          component="label"
          htmlFor="file-input"
          disabled={!connected || isUploading}
          sx={{ alignSelf: 'center' }}
        >
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!connected || isUploading}
          multiline
          maxRows={4}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!connected || isUploading || (!newMessage.trim() && !fileToUpload)}
          sx={{ minWidth: '80px' }}
        >
          {isUploading ? <CircularProgress size={24} color="inherit" /> : "Send"}
        </Button>
      </Box>
    </>
  );
};

export default Chat;
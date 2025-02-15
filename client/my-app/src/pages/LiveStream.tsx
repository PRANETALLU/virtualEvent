import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { io, Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Box, Button, Typography, Paper } from "@mui/material";

const SOCKET_URL = "http://localhost:5000"; // Update for deployment

const LiveStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const { eventId } = useParams<{ eventId: string }>();
  const { userInfo } = useUser();
  const [event, setEvent] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch event details
  useEffect(() => {
    axios.get(`http://localhost:5000/events/${eventId}`)
      .then((response) => setEvent(response.data))
      .catch((error) => console.error("Failed to fetch event:", error));
  }, [eventId]);

  const isOrganizer = event?.organizer?._id === userInfo?.id;

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(socketInstance);

    socketInstance.on("stream-started", () => setIsStreamActive(true));
    socketInstance.on("stream-stopped", () => setIsStreamActive(false));

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      socket.emit(isOrganizer ? "organizer-joined" : "viewer-joined", id);
    });

    if (isOrganizer) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          socket.emit("start-stream");

          socket.on("viewer-joined", (viewerPeerId) => {
            console.log("New viewer:", viewerPeerId);
            const call = peer.call(viewerPeerId, stream);
            call.on("error", (err) => console.error("Call error:", err));
          });
        })
        .catch((err) => console.error("Media access error:", err));
    } else {
      peer.on("call", (call) => {
        navigator.mediaDevices
          .getUserMedia({ video: false, audio: true }) // Dummy stream for handshake
          .then((dummyStream) => {
            call.answer(dummyStream);
            call.on("stream", (remoteStream) => {
              console.log("Receiving stream...");
              if (videoRef.current) videoRef.current.srcObject = remoteStream;
            });
          })
          .catch((err) => console.error("Failed to answer call:", err));
      });
    }

    return () => {
      peer.destroy();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [socket, isOrganizer]);

  const handleStopStream = async () => {
    if (socket) socket.emit("stop-stream");

    try {
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/stop`, {}, { withCredentials: true });
      navigate("/home");
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        height: "100vh",
        padding: 3,
        gap: 2 
      }}
    >
      <Typography variant="h4" fontWeight="bold">
        {isOrganizer ? "Organizer Live Stream" : "Attendee View"}
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ 
          width: "80%", 
          maxWidth: 800, 
          padding: 2, 
          textAlign: "center", 
          borderRadius: 3,
          backgroundColor: "#f9f9f9"
        }}
      >
        {isStreamActive ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: "100%", maxHeight: "60vh", borderRadius: 10, objectFit: "cover" }} 
          />
        ) : (
          <Typography variant="h6" color="textSecondary">
            Stream has been stopped
          </Typography>
        )}
        
        <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
          Peer ID: {peerId}
        </Typography>
        
        {isOrganizer && (
          <Button 
            variant="contained" 
            color="error" 
            sx={{ mt: 2, px: 3, py: 1 }} 
            onClick={handleStopStream}
          >
            Stop Stream
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default LiveStream;

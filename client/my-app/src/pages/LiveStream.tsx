import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { io, Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Box, Button, Typography, Paper, TextField, List, ListItem } from "@mui/material";

const SOCKET_URL = "http://localhost:5000";

const LiveStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { eventId } = useParams<{ eventId: string }>();
  const { userInfo } = useUser();
  const [event, setEvent] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required");
      console.log("Event ID is missing");
      return;
    }

    console.log(`Fetching event details for eventId: ${eventId}`);
    axios
      .get(`${SOCKET_URL}/events/${eventId}`)
      .then((response) => {
        setEvent(response.data);
        console.log("Event details loaded:", response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch event:", error);
        setError("Failed to load event details");
      });
  }, [eventId]);

  const isOrganizer = event?.organizer?._id === userInfo?.id;

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to server");
    });

    socketInstance.on("stream-started", () => {
      setIsStreamActive(true);
      console.log("Stream started");
    });

    socketInstance.on("stream-stopped", () => {
      setIsStreamActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        console.log("Stream stopped and tracks closed");
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log("Video element cleared");
      }
    });

    socketInstance.on("stream-status", (status: boolean) => {
      setIsStreamActive(status);
      console.log("Stream status updated:", status);
    });

    socketInstance.on("new-message", (message: string) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          {
            urls: "turn:numb.viagenie.ca",
            username: "webrtc@live.com",
            credential: "muazkh"
          }
        ],
      },
      debug: 3,
    });

    peerRef.current = peer;

    peer.on("open", (id) => {
      console.log("Peer connection opened with ID:", id);
      setPeerId(id);
      socket.emit(isOrganizer ? "organizer-joined" : "viewer-joined", {
        peerId: id,
        eventId,
      });
      socket.emit("check-stream-status", { eventId });
    });

    peer.on("error", (error) => {
      console.error("Peer connection error:", error);
      setError("Failed to establish peer connection");
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [socket, isOrganizer, eventId]);

  const handleStartStream = async () => {
    if (!isOrganizer || !socket || !peerRef.current) return;

    try {
      console.log("Requesting media stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Media stream acquired:", stream.id);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log("Local preview started");
        } catch (err) {
          console.error("Local preview failed:", err);
          videoRef.current.controls = true;
        }
      }

      socket.emit("start-stream", { peerId, eventId });
      setIsStreamActive(true);

    } catch (err) {
      console.error("Media access error:", err);
      setError("Failed to access camera/microphone - please check permissions");
    }
  };

  const handleStopStream = async () => {
    try {
      console.log("Stopping stream...");
      if (socket) {
        socket.emit("stop-stream", { eventId });
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsStreamActive(false);

      await axios.post(
        `${SOCKET_URL}/events/${eventId}/livestream/stop`,
        {},
        { withCredentials: true }
      );

      setTimeout(() => navigate("/home"), 500);
    } catch (error) {
      console.error("Error stopping stream:", error);
      setError("Failed to stop stream");
    }
  };

  const handleMuteUnmute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const handleDisableEnableCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraDisabled(!videoTrack.enabled);
      }
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket?.emit("send-message", {
        eventId,
        message: newMessage,
        sender: userInfo?.username,
      });
      setNewMessage("");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        padding: 3,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {isOrganizer ? "Organizer Live Stream" : "Attendee View"}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Paper
          elevation={3}
          sx={{
            width: "80%",
            maxWidth: 800,
            padding: 2,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: "#f9f9f9",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: "60vh",
              borderRadius: 10,
              objectFit: "cover",
              backgroundColor: "black",
              display: isStreamActive ? "block" : "none",
            }}
          />

          {!isStreamActive && (
            <Typography variant="h6" color="textSecondary">
              Stream is not active
            </Typography>
          )}

          {isOrganizer && !isStreamActive && (
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, px: 3, py: 1 }}
              onClick={handleStartStream}
            >
              Start Stream
            </Button>
          )}

          {isOrganizer && isStreamActive && (
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color={isMicMuted ? "secondary" : "primary"}
                onClick={handleMuteUnmute}
              >
                {isMicMuted ? "Unmute Mic" : "Mute Mic"}
              </Button>
              <Button
                variant="contained"
                color={isCameraDisabled ? "secondary" : "primary"}
                onClick={handleDisableEnableCamera}
              >
                {isCameraDisabled ? "Enable Camera" : "Disable Camera"}
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ ml: 2 }}
                onClick={handleStopStream}
              >
                Stop Stream
              </Button>
            </Box>
          )}

          {!isOrganizer && isStreamActive && (
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
              onClick={handleStopStream}
            >
              Stop Watching
            </Button>
          )}
        </Paper>
      </Box>

      <Box
        sx={{
          width: 350,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 2,
          borderLeft: "1px solid #ccc",
          backgroundColor: "#fff",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Live Chat
        </Typography>

        <List sx={{ overflowY: "auto", flex: 1, marginBottom: 2 }}>
          {chatMessages.map((msg, index) => (
            <ListItem key={index}>{msg}</ListItem>
          ))}
        </List>

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            variant="outlined"
            fullWidth
            label="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleSendMessage}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LiveStream;

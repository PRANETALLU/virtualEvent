import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { io, Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Box, Button, Typography, Paper } from "@mui/material";

const SOCKET_URL = "http://localhost:5000";

const LiveStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { eventId } = useParams<{ eventId: string }>();
  const { userInfo } = useUser();
  const [event, setEvent] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required");
      return;
    }

    axios.get(`${SOCKET_URL}/events/${eventId}`)
      .then((response) => setEvent(response.data))
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
      reconnectionAttempts: 5
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to server");
    });

    socketInstance.on("stream-started", () => setIsStreamActive(true));
    socketInstance.on("stream-stopped", () => {
      setIsStreamActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        console.log("Cleaning up stream");
        streamRef.current.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind);
          track.stop();
        });
      }
      if (peerRef.current) {
        console.log("Destroying peer connection");
        peerRef.current.destroy();
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ]
      }
    });

    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      socket.emit(isOrganizer ? "organizer-joined" : "viewer-joined", {
        peerId: id,
        eventId
      });
    });

    peer.on("error", (error) => {
      console.error("Peer connection error:", error);
      setError("Failed to establish peer connection");
    });

    if (!isOrganizer) {
      peer.on("call", (call) => {
        console.log("Received call from organizer");
        
        call.answer(); // Answer without sending a stream back
        
        call.on("stream", (remoteStream) => {
          console.log("Received remote stream tracks:", remoteStream.getTracks());
          
          if (videoRef.current) {
            console.log("Setting viewer video source");
            videoRef.current.srcObject = remoteStream;
            
            videoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded");
              videoRef.current?.play()
                .then(() => console.log("Playback started"))
                .catch((err) => {
                  console.error("Playback failed:", err);
                  setError("Failed to play video - please click to play");
                });
            };
          }
        });
    
        call.on("error", (error) => {
          console.error("Call error:", error);
          setError("Stream connection error");
        });
    
        call.on("close", () => {
          console.log("Call closed");
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        });
      });
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, isOrganizer, eventId]);
  
  useLayoutEffect(() => {
    if (videoRef.current) {
      console.log("videoRef is available:", videoRef.current);
    }
  }, []);
  
  const handleStartStream = async () => {
    if (!isOrganizer || !socket) return;
  
    try {
      console.log("Requesting media stream...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log("Got media stream:", stream.getTracks());
      streamRef.current = stream;
      
      // Show local preview
      console.log("video Current", videoRef.current)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.load();  // Force refresh
        videoRef.current.onloadedmetadata = () => {
          console.log("Metadata loaded");
          videoRef.current?.play()
            .then(() => console.log("Video started playing"))
            .catch(err => console.error("Playback error:", err));
        };
      }
  
      // Notify server that stream is starting
      socket.emit("start-stream", { peerId, eventId });
      setIsStreamActive(true);
  
      // Remove any existing viewer-joined listener
      socket.off("viewer-joined");
      
      // Add new viewer-joined listener
      socket.on("viewer-joined", ({ viewerPeerId }) => {
        console.log("New viewer joined:", viewerPeerId);
        
        if (!streamRef.current || !peerRef.current) {
          console.error("No media stream or peer connection available");
          return;
        }
  
        // Call the viewer and send our stream
        console.log("Calling viewer with stream");
        const call = peerRef.current.call(viewerPeerId, streamRef.current);
        
        call.on("error", (err) => {
          console.error("Call error:", err);
          setError("Failed to connect to viewer");
        });
      });
  
    } catch (err) {
      console.error("Media access error:", err);
      setError("Failed to access camera/microphone - please check permissions");
    }
  };

  const handleStopStream = async () => {
    try {
      if (socket) {
        socket.emit("stop-stream", { eventId });
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      await axios.post(
        `${SOCKET_URL}/events/${eventId}/livestream/stop`,
        {},
        { withCredentials: true }
      );

      navigate("/home");
    } catch (error) {
      console.error("Error stopping stream:", error);
      setError("Failed to stop stream");
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
          backgroundColor: "#f9f9f9"
        }}
      >
        {isStreamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ 
              width: "100%", 
              maxHeight: "60vh", 
              borderRadius: 10, 
              objectFit: "cover",
              backgroundColor: "black" 
            }}
          />
        ) : (
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
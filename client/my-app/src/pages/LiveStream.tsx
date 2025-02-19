import { useEffect, useRef, useState } from "react";
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
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
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

    axios
      .get(`${SOCKET_URL}/events/${eventId}`)
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
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to server");
    });

    socketInstance.on("stream-started", () => setIsStreamActive(true));
    socketInstance.on("stream-stopped", () => {
      setIsStreamActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    socketInstance.on("stream-status", (status: boolean) => {
      setIsStreamActive(status);
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
        ],
      },
      debug: 3, // Enable detailed logging
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

    // Organizer: Handle new viewers joining
    if (isOrganizer) {
      socket.on("viewer-joined", ({ viewerPeerId }) => {
        console.log("New viewer joined, attempting to call:", viewerPeerId);
        if (streamRef.current && peerRef.current) {
          const call = peerRef.current.call(viewerPeerId, streamRef.current);
          call.on("error", (err) => {
            console.error("Call to viewer failed:", err);
            setError("Failed to connect to viewer");
          });
        } else {
          console.log("No stream available yet for viewer:", viewerPeerId);
        }
      });
    }

    // Viewer: Handle incoming stream
    if (!isOrganizer) {
      peer.on("call", async (call) => {
        console.log("Received call from organizer");
        
        call.answer(); // Answer without sending a stream back
        
        call.on("stream", (remoteStream) => {
          console.log("Received remote stream:", remoteStream.id);
          if (videoRef.current && remoteStream.getVideoTracks().length > 0) {
            videoRef.current.srcObject = remoteStream;
            
            const playVideo = async () => {
              try {
                await videoRef.current?.play();
                console.log("Video playback started successfully");
              } catch (err) {
                console.error("Video playback failed:", err);
                setError("Failed to play video - please click to play");
                if (videoRef.current) {
                  videoRef.current.controls = true; // Enable controls for manual play
                }
              }
            };

            videoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded, attempting playback");
              playVideo();
            };
          } else {
            console.error("Invalid video element or no video tracks in stream");
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
      if (socket) {
        socket.off("viewer-joined");
      }
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

      // Set up local preview
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

      // Notify server that stream is starting
      socket.emit("start-stream", { peerId, eventId });
      setIsStreamActive(true);

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

      navigate("/home");
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: 3,
        gap: 2,
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
              sx={{ ml: 2, px: 3, py: 1 }}
              onClick={handleStopStream}
            >
              Stop Stream
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LiveStream;

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useParams } from "react-router-dom";

const LiveStream = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingError, setStreamingError] = useState("");
  const { userInfo } = useUser();

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket("ws://localhost:5000/ws");

    socket.onopen = () => {
      console.log("WebSocket connected!");
      setConnected(true);
      // Join room with eventId for better message routing
      if (eventId) {
        socket.send(JSON.stringify({ 
          type: "join-room", 
          eventId, 
          role: isOrganizer ? "organizer" : "attendee" 
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStreamingError("WebSocket connection failed");
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [eventId, isOrganizer]);

  useEffect(() => {
    if (!eventId) return;

    axios
      .get(`http://localhost:5000/events/${eventId}`)
      .then((response) => {
        setEvent(response.data);
        const isEventOrganizer = response.data.organizer?._id === userInfo?.id;
        setIsOrganizer(isEventOrganizer);
        console.log(`User role: ${isEventOrganizer ? "Organizer" : "Attendee"}`);
      })
      .catch((error) => {
        console.error("Failed to load event details:", error);
        setStreamingError("Failed to load event details");
      });
  }, [eventId, userInfo]);

  useEffect(() => {
    if (!ws || !connected) return;

    ws.onmessage = async (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log("WebSocket message received:", data.type);
        
        if (!data.eventId || data.eventId !== eventId) return;

        switch (data.type) {
          case "offer":
            console.log("Received offer as attendee:", !isOrganizer);
            if (!isOrganizer) await handleReceiveOffer(data.offer);
            break;
          case "answer":
            console.log("Received answer as organizer:", isOrganizer);
            if (isOrganizer && peerConnectionRef.current) {
              try {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log("Remote description set successfully");
              } catch (err) {
                console.error("Error setting remote description:", err);
              }
            }
            break;
          case "ice-candidate":
            console.log("Received ICE candidate");
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
              try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log("ICE candidate added successfully");
              } catch (err) {
                console.error("Error adding ICE candidate:", err);
              }
            } else {
              console.log("Skipping ICE candidate - connection not ready");
            }
            break;
          case "stream-started":
            console.log("Stream started notification received");
            break;
          case "stream-stopped":
            console.log("Stream stopped notification received");
            if (!isOrganizer) {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              setIsStreaming(false);
            }
            break;
          default:
            console.log("Unknown message type:", data.type);
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    return () => {
      ws.onmessage = null;
    };
  }, [ws, eventId, isOrganizer, connected]);

  const initPeerConnection = () => {
    // Close any existing connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    console.log("Initializing new peer connection");
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          username: "webrtc@live.com",
          credential: "muazkh"
        }
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws?.readyState === WebSocket.OPEN) {
        console.log("Sending ICE candidate");
        ws.send(JSON.stringify({ 
          type: "ice-candidate", 
          eventId, 
          candidate: event.candidate,
          role: isOrganizer ? "organizer" : "attendee"
        }));
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log("Signaling state:", peerConnection.signalingState);
    };

    // This is critical for attendees to receive video
    peerConnection.ontrack = (event) => {
      console.log("ontrack event triggered!", event.streams);
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        console.log("Setting remote video stream");
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(err => {
          console.error("Error playing remote video:", err);
        });
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startStreaming = async () => {
    if (!isOrganizer || !ws || ws.readyState !== WebSocket.OPEN) {
      console.error("Cannot start streaming: not an organizer or WebSocket not connected");
      return;
    }

    try {
      setStreamingError("");
      console.log("Requesting media stream");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      console.log("Media stream obtained:", stream.getTracks().length, "tracks");
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(err => {
          console.error("Error playing local video:", err);
        });
      }

      localStreamRef.current = stream;

      const peerConnection = initPeerConnection();
      
      // Add tracks to the peer connection (critical for streaming)
      stream.getTracks().forEach((track) => {
        console.log(`Adding ${track.kind} track to peer connection`);
        peerConnection.addTrack(track, stream);
      });

      console.log("Creating offer");
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      console.log("Setting local description");
      await peerConnection.setLocalDescription(offer);

      // Wait a moment for ICE gathering
      setTimeout(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          console.log("Sending offer to attendees");
          ws.send(JSON.stringify({ 
            type: "offer", 
            eventId, 
            offer: peerConnection.localDescription,
            role: "organizer"
          }));
          
          // Notify all clients that stream has started
          ws.send(JSON.stringify({
            type: "stream-started",
            eventId
          }));
          
          setIsStreaming(true);
        }
      }, 1000);

    } catch (error) {
      console.error("Streaming error:", error);
      setStreamingError(`Failed to start streaming`);
    }
  };

  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit) => {
    if (isOrganizer) {
      console.log("Ignoring offer: I am the organizer");
      return;
    }

    console.log("Attendee receiving offer from organizer");
    try {
      const peerConnection = initPeerConnection();
      
      console.log("Setting remote description with offer");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      console.log("Creating answer");
      const answer = await peerConnection.createAnswer();
      
      console.log("Setting local description with answer");
      await peerConnection.setLocalDescription(answer);

      // Wait a moment for ICE gathering
      setTimeout(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          console.log("Sending answer to organizer");
          ws.send(JSON.stringify({ 
            type: "answer", 
            eventId, 
            answer: peerConnection.localDescription,
            role: "attendee"
          }));
        }
      }, 1000);
      
      setIsStreaming(true);
      
    } catch (error) {
      console.error("Error handling offer:", error);
      setStreamingError(`Failed to process stream`);
    }
  };

  const stopStreaming = () => {
    console.log("Stopping stream");
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "stream-stopped",
        eventId
      }));
    }
    
    setIsStreaming(false);
  };

  return (
    <div style={{padding: "20px", maxWidth: "1200px", margin: "0 auto", paddingTop: 100}}>
      <h2>{isOrganizer ? "Event Live Stream - Organizer View" : "Event Live Stream - Attendee View"}</h2>
      
      {/* Connection status indicator */}
      <div style={{marginBottom: "10px"}}>
        <span style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: connected ? "green" : "red",
          marginRight: "8px"
        }}></span>
        {connected ? "Connected to server" : "Disconnected from server"}
      </div>
      
      <div style={{display: "flex", gap: "20px", flexWrap: "wrap"}}>
        {/* Organizer controls */}
        {isOrganizer && (
          <div style={{
            flex: "1",
            minWidth: "300px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9"
          }}>
            <h3>Broadcast Controls</h3>
            <button 
              onClick={isStreaming ? stopStreaming : startStreaming}
              style={{
                padding: "10px 15px",
                fontSize: "16px",
                backgroundColor: isStreaming ? "#e74c3c" : "#2ecc71",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {isStreaming ? "Stop Streaming" : "Start Streaming"}
            </button>
            
            <div style={{marginTop: "15px"}}>
              <h4>Preview</h4>
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                style={{
                  width: "100%",
                  backgroundColor: "#000",
                  borderRadius: "4px",
                  display: "block"
                }} 
              />
            </div>
          </div>
        )}
        
        {/* Stream view (for both organizer and attendee) */}
        <div style={{
          flex: "2",
          minWidth: "400px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px"
        }}>
          <h3>{isOrganizer ? "Stream Preview" : "Live Stream"}</h3>
          
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            controls
            style={{
              width: "100%",
              backgroundColor: "#000",
              borderRadius: "4px",
              display: isOrganizer ? "none" : "block",
              minHeight: "300px"
            }} 
          />
          
          {!isStreaming && !isOrganizer && (
            <div style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px"
            }}>
              <p>Waiting for the organizer to start the stream...</p>
            </div>
          )}
          
          {streamingError && (
            <p style={{ color: "red", marginTop: "10px" }}>{streamingError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStream;


/*import { useEffect, useState } from "react";

const LiveStream = () => {
  const [status, setStatus] = useState("Connecting...");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws");

    ws.onopen = () => {
      setStatus("Connected ✅");
      ws.send("Hello Server!");
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("WebSocket Error ❌");
    };

    ws.onclose = () => setStatus("Connection Closed 🚪");

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 border rounded bg-gray-100" style={{paddingTop: 40}}>
      <h2 className="text-lg font-bold">WebSocket Test</h2>
      <p>{status}</p>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

export default LiveStream;*/


/*import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { io, Socket } from "socket.io-client";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Box, Button, Typography, Paper, TextField, List, ListItem } from "@mui/material";
import Chat from "../components/Chat";

const SOCKET_URL = "http://localhost:5000";

const LiveStream2 = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [organizerPeerId, setOrganizerPeerId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { eventId } = useParams<{ eventId: string }>();
  const { userInfo } = useUser();
  const [event, setEvent] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch event details
  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required");
      return;
    }

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

  // Socket connection setup
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

    socketInstance.on("stream-started", (data: { organizerPeerId: string }) => {
      setIsStreamActive(true);
      setOrganizerPeerId(data.organizerPeerId);
      console.log("Stream started with organizer peer ID:", data.organizerPeerId);
    });

    socketInstance.on("stream-stopped", () => {
      handleStreamStop();
    });

    socketInstance.on("stream-status", (data: { active: boolean; organizerPeerId: string | null }) => {
      setIsStreamActive(data.active);
      setOrganizerPeerId(data.organizerPeerId);
      console.log("Stream status updated:", data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Peer connection setup
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

    if (!isOrganizer) {
      // Viewer peer handling
      peer.on("call", async (call) => {
        console.log("Receiving call from organizer");
        call.answer(); // Answer without sending stream back

        call.on("stream", (remoteStream) => {
          console.log("Received remote stream");
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(err => {
              console.error("Error playing remote stream:", err);
              videoRef.current!.controls = true;
            });
          }
        });

        call.on("error", (error) => {
          console.error("Call error:", error);
          setError("Error receiving stream");
        });
      });
    }

    peer.on("error", (error) => {
      console.error("Peer connection error:", error);
      setError("Failed to establish peer connection");
    });

    return () => {
      cleanupStream();
    };
  }, [socket, isOrganizer, eventId]);

  // Viewer connection to organizer stream
  useEffect(() => {
    if (!isOrganizer && isStreamActive && organizerPeerId && peerRef.current) {
      connectToOrganizerStream();
    }
  }, [isStreamActive, organizerPeerId, isOrganizer]);

  const connectToOrganizerStream = async () => {
    if (!organizerPeerId || !peerRef.current) return;

    try {
      console.log("Connecting to organizer peer:", organizerPeerId);
      const call = peerRef.current.call(organizerPeerId, new MediaStream());

      call.on("stream", (remoteStream) => {
        console.log("Received organizer's stream");
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play().catch(err => {
            console.error("Error playing remote stream:", err);
            videoRef.current!.controls = true;
          });
        }
      });

      call.on("error", (error) => {
        console.error("Call error:", error);
        setError("Failed to connect to organizer's stream");
      });
    } catch (err) {
      console.error("Error connecting to organizer:", err);
      setError("Failed to connect to stream");
    }
  };

  const handleStartStream = async () => {
    if (!isOrganizer || !socket || !peerRef.current) return;
    console.log("Peer ID before starting stream:", peerId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => {
          console.error("Local preview failed:", err);
          videoRef.current!.controls = true;
        });
      }

      // Set up peer call handling for organizer
      peerRef.current.on("call", (call) => {
        console.log("Answering call from viewer:", call.peer);
        call.answer(stream);
      });

      socket.emit("start-stream", { peerId, eventId });
      setIsStreamActive(true);

    } catch (err) {
      console.error("Media access error:", err);
      setError("Failed to access camera/microphone - please check permissions");
    }
  };

  const handleStreamStop = () => {
    setIsStreamActive(false);
    setOrganizerPeerId(null);
    cleanupStream();
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
  };

  const handleStopStream = async () => {
    try {
      if (socket) {
        socket.emit("stop-stream", { eventId });
      }

      handleStreamStop();

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

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        padding: 12,
        maxWidth: "1600px",
        margin: "0"
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, textAlign: "center" }}>
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
            display: "flex",
            height: "calc(100vh - 120px)",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#f9f9f9"
          }}
        >
  
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: 3,
              minWidth: 0
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "calc(100% - 80px)",
                backgroundColor: "black",
                borderRadius: 1,
                overflow: "hidden"
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: isStreamActive ? "block" : "none"
                }}
              />
              {!isStreamActive && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  <Typography variant="h6" color="white">
                    Stream is not active
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 3
              }}
            >
              {isOrganizer && !isStreamActive && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartStream}
                >
                  Start Stream
                </Button>
              )}

              {isOrganizer && isStreamActive && (
                <>
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
                    onClick={handleStopStream}
                  >
                    Stop Stream
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {eventId && <Chat eventId={eventId} />}
        </Paper>
      </Box>
    </Box>
  ); 
};

export default LiveStream2;*/
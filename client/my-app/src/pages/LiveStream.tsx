import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useParams } from "react-router-dom";
import Chat from "../components/Chat";
import { Box, Button, Card, CardContent, Typography, CircularProgress } from "@mui/material"; 

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
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto", pt: 12 }}>
      <Typography variant="h4" gutterBottom>
        {isOrganizer ? "Event Live Stream - Organizer View" : "Event Live Stream - Attendee View"}
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: connected ? "green" : "red" }} />
        <Typography>{connected ? "Connected to server" : "Disconnected from server"}</Typography>
      </Box>

      <Box display="flex" gap={3} flexWrap="wrap">
        {/* Organizer Controls */}
        {isOrganizer && (
          <Card sx={{ flex: 1, minWidth: 300, p: 2, backgroundColor: "#f9f9f9" }}>
            <CardContent>
              <Typography variant="h6">Broadcast Controls</Typography>
              <Button 
                onClick={isStreaming ? stopStreaming : startStreaming}
                variant="contained"
                color={isStreaming ? "error" : "success"}
                sx={{ mt: 2 }}
              >
                {isStreaming ? "Stop Streaming" : "Start Streaming"}
              </Button>
              <Typography variant="subtitle1" mt={2}>Preview</Typography>
              <Box component="video" ref={localVideoRef} autoPlay muted playsInline sx={{ width: "100%", bgcolor: "black", borderRadius: 1, mt: 1 }} />
            </CardContent>
          </Card>
        )}

        {/* Stream View */}
        {!isOrganizer && (<Card sx={{ flex: 2, minWidth: 400, p: 2 }}>
          <CardContent>
            <Typography variant="h6">Live Stream</Typography>
            <Box
              component="video"
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls
              sx={{ width: "100%", bgcolor: "black", borderRadius: 1, display: isOrganizer ? "none" : "block", minHeight: 300 }}
            />
            {!isStreaming && (
              <Box textAlign="center" py={5} bgcolor="#f0f0f0" borderRadius={1}>
                <Typography>Waiting for the organizer to start the stream...</Typography>
              </Box>
            )}
            {streamingError && <Typography color="error" mt={1}>{streamingError}</Typography>}
          </CardContent>
        </Card>)}

        {/* Chat Component */}
        {eventId && (
          <Card sx={{ flex: 1, minWidth: 300, p: 2 }}>
            <CardContent>
              <Chat eventId={eventId} />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default LiveStream;
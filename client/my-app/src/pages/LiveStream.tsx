import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../components/Chat";
import { Box, Button, Card, CardContent, Typography, CircularProgress } from "@mui/material";

const LiveStream = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingError, setStreamingError] = useState("");
  const { userInfo } = useUser();
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

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
          role: isOrganizer ? "organizer" : "attendee",
          clientId: clientIdRef.current
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
          case "room-joined":
            console.log("Room joined with status:", data);
            // If stream is active when joining, update UI
            if (data.streamActive && !isOrganizer) {
              setIsStreaming(true);
            }
            break;
          case "new-attendee":
            console.log("New attendee joined, sending fresh offer");
            if (isOrganizer && isStreaming && localStreamRef.current) {
              await regenerateOffer(data.connectionId);
            }
            break;
          case "offer":
            console.log("Received offer as attendee:", !isOrganizer);
            if (!isOrganizer) await handleReceiveOffer(data.offer, data.connectionId);
            break;
          case "answer":
            console.log("Received answer as organizer:", isOrganizer);
            if (isOrganizer) {
              const connectionId = data.connectionId || 'default';
              const peerConnection = peerConnectionsRef.current.get(connectionId);

              if (peerConnection) {
                try {
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                  console.log(`Remote description set successfully for connection: ${connectionId}`);
                } catch (err) {
                  console.error(`Error setting remote description for connection ${connectionId}:`, err);
                }
              } else {
                console.error(`Peer connection not found for: ${connectionId}`);
              }
            }
            break;
          case "ice-candidate":
            console.log("Received ICE candidate");
            const connectionId = data.connectionId || 'default';
            const peerConnection = peerConnectionsRef.current.get(connectionId);

            if (peerConnection && peerConnection.remoteDescription) {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log(`ICE candidate added successfully for connection: ${connectionId}`);
              } catch (err) {
                console.error(`Error adding ICE candidate for connection ${connectionId}:`, err);
              }
            } else {
              console.log(`Skipping ICE candidate - connection ${connectionId} not ready`);
            }
            break;
          case "stream-started":
            console.log("Stream started notification received");
            if (!isOrganizer) {
              setIsStreaming(true);
            }
            break;
          case "stream-stopped":
            console.log("Stream stopped notification received");
            if (!isOrganizer) {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              setIsStreaming(false);
            }
            // Clean up all peer connections for both organizer and attendee
            for (const [id, connection] of peerConnectionsRef.current.entries()) {
              console.log(`Closing connection: ${id}`);
              connection.close();
            }
            peerConnectionsRef.current.clear();
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
  }, [ws, eventId, isOrganizer, connected, isStreaming]);

  const initPeerConnection = (connectionId = 'default') => {
    // Close existing connection with this ID if it exists
    if (peerConnectionsRef.current.has(connectionId)) {
      peerConnectionsRef.current.get(connectionId)?.close();
    }

    console.log(`Initializing new peer connection: ${connectionId}`);
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
        console.log(`Sending ICE candidate for connection: ${connectionId}`);
        ws.send(JSON.stringify({
          type: "ice-candidate",
          eventId,
          candidate: event.candidate,
          role: isOrganizer ? "organizer" : "attendee",
          connectionId
        }));
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${connectionId}:`, peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${connectionId}:`, peerConnection.connectionState);

      // Clean up failed or closed connections
      if (peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed") {
        peerConnectionsRef.current.delete(connectionId);
      }
    };

    peerConnection.onsignalingstatechange = () => {
      console.log(`Signaling state for ${connectionId}:`, peerConnection.signalingState);
    };

    // This is critical for attendees to receive video
    peerConnection.ontrack = (event) => {
      console.log(`ontrack event triggered for ${connectionId}!`, event.streams);
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        console.log("Setting remote video stream");
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(err => {
          console.error("Error playing remote video:", err);
        });
      }
    };

    peerConnectionsRef.current.set(connectionId, peerConnection);
    return peerConnection;
  };

  const regenerateOffer = async (connectionId = 'default') => {
    if (!isOrganizer || !localStreamRef.current || !ws) return;

    try {
      //const connectionId = `attendee-${Date.now()}`;
      const peerConnection = initPeerConnection(connectionId);

      // Add tracks from the existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current as MediaStream);
        });
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnection.setLocalDescription(offer);

      // Wait a moment for ICE gathering
      setTimeout(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          console.log("Sending fresh offer for new attendee");
          ws.send(JSON.stringify({
            type: "offer",
            eventId,
            offer: peerConnection.localDescription,
            role: "organizer",
            connectionId
          }));
        }
      }, 1000);
    } catch (error) {
      console.error("Error regenerating offer:", error);
    }
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

      // Use default connection for initial streaming
      const connectionId = 'default';
      const peerConnection = initPeerConnection(connectionId);

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
            role: "organizer",
            connectionId
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

  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit, connectionId = 'default') => {
    if (isOrganizer) {
      console.log("Ignoring offer: I am the organizer");
      return;
    }

    console.log(`Attendee receiving offer from organizer with connection ID: ${connectionId}`);
    try {
      const peerConnection = initPeerConnection(connectionId);

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
            role: "attendee",
            connectionId
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

    // Close all peer connections
    for (const [id, connection] of peerConnectionsRef.current.entries()) {
      console.log(`Closing connection: ${id}`);
      connection.close();
    }
    peerConnectionsRef.current.clear();

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

  const endStreaming = async () => {
    try {
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/stop`, {}, { withCredentials: true });
      navigate('/home'); 
    }
    catch(error) {
      console.error("Error stopping livestream:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" }, // Stack on small screens, side-by-side on medium+
        justifyContent: "center",
        alignItems: "stretch", // Align content properly
        minHeight: "100vh",
        paddingTop: 12,
        paddingBottom: 4, 
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        gap: 0, // No gap between video and chat sections
      }}
    >
      {/* Video Section */}
      <Box
        sx={{
          flex: 2, // Video takes more space
          minWidth: 300,
          maxWidth: "700px",
          p: 2,
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          {isOrganizer ? "Broadcast Controls" : "Live Stream"}
        </Typography>

        {isOrganizer ? (
          <>
            <Button
              onClick={isStreaming ? stopStreaming : startStreaming}
              variant="contained"
              color={isStreaming ? "error" : "success"}
              sx={{ mt: 2, width: "100%" }}
            >
              {isStreaming ? "Stop Streaming" : "Start Streaming"}
            </Button>
            <Button
              onClick={endStreaming}
              variant="contained"
              sx={{ mt: 2, width: "100%" }}
            >
              End Stream
            </Button>
            <Typography variant="subtitle1" mt={2}>Preview</Typography>
            <Box
              component="video"
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              sx={{ width: "100%", bgcolor: "black", borderRadius: 1, mt: 1 }}
            />
          </>
        ) : (
          <>
            <Box
              component="video"
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls
              sx={{ width: "100%", bgcolor: "black", borderRadius: 1, minHeight: 300 }}
            />
            {!isStreaming && (
              <Box textAlign="center" py={5} bgcolor="#f0f0f0" borderRadius={1}>
                <Typography>Waiting for the organizer to start the stream...</Typography>
              </Box>
            )}
            {streamingError && <Typography color="error" mt={1}>{streamingError}</Typography>}
          </>
        )}
      </Box>

      {/* Chat Section */}
      {eventId && (
        <Box
          sx={{
            flex: 1, // Chat takes the remaining space
            minWidth: 300,
            maxWidth: "400px",
            p: 2,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 3,
            display: "flex",
            flexDirection: "column",
            paddingTop: 0, // Ensure no extra padding at the top
          }}
        >
          <Chat eventId={eventId} />
        </Box>
      )}
    </Box>




  );
};

export default LiveStream;
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Peer from "peerjs";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { useUser } from "../context/UserContext";

const SOCKET_URL = "http://localhost:5000";

const LiveStreamPage: React.FC = () => {
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

  useEffect(() => {
    if (!event) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    const newPeer = new Peer();
    peerRef.current = newPeer;

    newPeer.on("open", (id) => {
      setPeerId(id);
      console.log("My Peer ID:", id);
      if (isOrganizer) {
        newSocket.emit("organizer-ready", { eventId, peerId: id });
        
        // Handle incoming calls from viewers
        newPeer.on("call", (call) => {
          if (streamRef.current) {
            call.answer(streamRef.current);
            console.log("Answering viewer call");
          }
        });
      }
    });

    newSocket.on("organizer-ready", ({ peerId }) => {
      setOrganizerPeerId(peerId);
      console.log("Organizer is live:", peerId);
    });

    return () => {
      newSocket.disconnect();
      peerRef.current?.destroy();
    };
  }, [event, isOrganizer, eventId]);

  // Separate useEffect for viewer connection
  useEffect(() => {
    if (!isOrganizer && organizerPeerId && peerRef.current) {
      console.log("Viewer connecting to organizer:", organizerPeerId);
      
      // Create an empty stream for the initial connection
      navigator.mediaDevices.getUserMedia({ video: false, audio: false })
        .then(emptyStream => {
          const call = peerRef.current?.call(organizerPeerId, emptyStream);
          
          call?.on("stream", (remoteStream) => {
            console.log("Received organizer stream");
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
            }
          });

          call?.on("error", (err) => {
            console.error("Peer call error:", err);
            setError("Failed to connect to stream");
          });
        })
        .catch(err => {
          console.error("Failed to create empty stream:", err);
          setError("Failed to initialize viewer connection");
        });
    }
  }, [organizerPeerId, isOrganizer]);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isCameraDisabled,
        audio: !isMicMuted,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreamActive(true);
      console.log("Streaming started.");

      // Re-emit organizer-ready to notify any viewers that joined before the stream started
      if (socket && peerId) {
        socket.emit("organizer-ready", { eventId, peerId });
      }
    } catch (error) {
      console.error("Error starting stream:", error);
      setError("Failed to start streaming");
    }
  };
  
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => (track.enabled = !isMicMuted));
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => (track.enabled = !isCameraDisabled));
      setIsCameraDisabled(!isCameraDisabled);
    }
  };

  return (
    <div>
      <h1>{isOrganizer ? "Live Streaming" : "Watching Live Stream"}</h1>

      {error && <p className="error">{error}</p>}

      <video ref={videoRef} autoPlay playsInline muted={isOrganizer} />

      {isOrganizer && (
        <div>
          {!isStreamActive ? (
            <button onClick={startStream}>Start Stream</button>
          ) : (
            <>
              <button onClick={toggleMic}>{isMicMuted ? "Unmute Mic" : "Mute Mic"}</button>
              <button onClick={toggleCamera}>{isCameraDisabled ? "Enable Camera" : "Disable Camera"}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveStreamPage;

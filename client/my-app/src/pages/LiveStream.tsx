import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { useUser } from "../context/UserContext";

const socket = io("http://localhost:5000", { transports: ["websocket", "polling"] });

const LiveStream: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { userInfo } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("join-room", eventId);

    socket.on("receive-stream", (streamData: any) => {
      if (streamVideoRef.current) {
        const stream = new MediaStream();
        const videoTrack = new Blob([streamData], { type: "video/webm" });
        stream.addTrack(new MediaStreamTrack(videoTrack));
        streamVideoRef.current.srcObject = stream;
      }
    });

    return () => {
      socket.off("receive-stream");
    };
  }, [eventId]);

  useEffect(() => {
    if (!userInfo) return;
    
    const startStreaming = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStreamRef.current = stream;

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        setStreaming(true);
        socket.emit("start-stream", { eventId, userId: userInfo.id });

        stream.getTracks().forEach((track) => {
          track.onended = () => stopStreaming();
        });

        stream.oninactive = stopStreaming;
      } catch (error) {
        console.error("Error starting stream:", error);
      }
    };

    if (userInfo.isOrganizer) startStreaming();
  }, [userInfo]);

  const stopStreaming = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = null;
      }

      setStreaming(false);
      socket.emit("stop-stream", eventId);

      await fetch(`http://localhost:5000/api/events/${eventId}/livestream/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      navigate("/home");
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  return (
    <div>
      <h2>Live Streaming</h2>
      {userInfo?.isOrganizer ? (
        <>
          <video ref={myVideoRef} autoPlay playsInline></video>
          {streaming && <button onClick={stopStreaming}>Stop Streaming</button>}
        </>
      ) : (
        <video ref={streamVideoRef} autoPlay playsInline></video>
      )}
    </div>
  );
};

export default LiveStream;

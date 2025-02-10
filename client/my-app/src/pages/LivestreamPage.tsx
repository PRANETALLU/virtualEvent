import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

interface LiveStreamProps {
  eventId: string;
}

const LiveStream: React.FC<LiveStreamProps> = ({ eventId }) => {
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on("view", (data: MediaStream) => {
      if (streamVideoRef.current) {
        streamVideoRef.current.srcObject = data;
      }
    });

    return () => {
      socket.off("view");
    };
  }, []);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      setStreaming(true);
      socket.emit("stream", stream);

      // API call to mark the event as live
      await fetch(`http://localhost:5000/api/events/${eventId}/livestream/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

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
      socket.emit("stop-stream");

      // API call to mark the event as ended
      await fetch(`http://localhost:5000/api/events/${eventId}/livestream/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error stopping stream:", error);
    }
  };

  return (
    <div>
      <h2>Live Streaming</h2>
      <video ref={myVideoRef} autoPlay playsInline></video>
      <video ref={streamVideoRef} autoPlay playsInline></video>
      {!streaming ? (
        <button onClick={startStreaming}>Start Streaming</button>
      ) : (
        <button onClick={stopStreaming}>Stop Streaming</button>
      )}
    </div>
  );
};

export default LiveStream;

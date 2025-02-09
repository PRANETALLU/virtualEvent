import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

const LiveStream: React.FC = () => {
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [streaming, setStreaming] = useState(false);

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
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      setStreaming(true);

      setInterval(() => {
        socket.emit("stream", stream);
      }, 100);
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  return (
    <div>
      <h2>Live Streaming</h2>
      <video ref={myVideoRef} autoPlay playsInline></video>
      <video ref={streamVideoRef} autoPlay playsInline></video>
      {!streaming && <button onClick={startStreaming}>Start Streaming</button>}
    </div>
  );
};

export default LiveStream;

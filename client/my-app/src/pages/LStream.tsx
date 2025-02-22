import { useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const LStream = () => {
  const [peerId, setPeerId] = useState<string>("");
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log("Connecting to socket server...");
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("new-stream", (orgId: string) => {
      console.log("Received new stream from organizer with ID:", orgId);
      setOrganizerId(orgId);
    });

    return () => {
      console.log("Disconnecting socket...");
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id: string) => {
      console.log("Peer connection opened with ID:", id);
      setPeerId(id);
    });

    peer.on("call", (call: MediaConnection) => {
      console.log("Incoming call received...");
      call.answer(new MediaStream()); // Answer with an empty stream
      call.on("stream", (stream: MediaStream) => {
        console.log("Received stream from caller");
        setRemoteStream(stream);
      });

      call.on("close", () => {
        console.log("Call closed, clearing remote stream");
        setRemoteStream(null);
      });
    });

    return () => {
      console.log("Destroying peer connection...");
      peerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log("Setting remote stream to video element");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startBroadcast = () => {
    console.log("Starting broadcast...");
    setIsOrganizer(true);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream: MediaStream) => {
      console.log("Received media stream for broadcast");
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      peerRef.current?.on("call", (call: MediaConnection) => {
        console.log("Answering call with organizer stream...");
        call.answer(stream); // Send the organizer's stream
      });

      socketRef.current?.emit("organizer-start", peerId);
      console.log("Emitted organizer-start event with peerId:", peerId);
    }).catch((err) => {
      console.error("Error accessing media devices:", err);
    });
  };

  const joinSession = () => {
    console.log("Joining session as attendee...");
    socketRef.current?.emit("attendee-join");
    socketRef.current?.on("organizer-peer-id", (orgId: string) => {
      console.log("Received organizer peer ID:", orgId);
      setOrganizerId(orgId);

      const emptyStream = new MediaStream();
      const call = peerRef.current?.call(orgId, emptyStream); // Attendee just listens to the organizer's stream
      console.log("Calling organizer with empty stream...");

      call?.on("stream", (stream: MediaStream) => {
        console.log("Received stream from organizer in attendee view");
        setRemoteStream(stream);
      });

      call?.on("close", () => {
        console.log("Call closed in attendee view, clearing remote stream");
        setRemoteStream(null);
      });
    });
  };

  return (
    <div>
      <h1>Live Streaming Platform</h1>
      {!isOrganizer && (
        <>
          <button onClick={startBroadcast}>Start Broadcast</button>
          <button onClick={joinSession}>Join as Attendee</button>
        </>
      )}

      <div>
        {isOrganizer && <video ref={myVideoRef} autoPlay muted style={{ width: "300px", height: "200px" }} />}
        <video ref={remoteVideoRef} autoPlay style={{ width: "300px", height: "200px" }} />
      </div>
    </div>
  );
};

export default LStream;

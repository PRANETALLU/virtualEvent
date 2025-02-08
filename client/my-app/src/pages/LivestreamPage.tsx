import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLivestream } from "../context/LivestreamContext";
import SimplePeer from "simple-peer";

const LivestreamPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { streamUrl, fetchLivestream } = useLivestream();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchLivestream(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (streamUrl) {
      const peerInstance = new SimplePeer({ initiator: false, trickle: false });

      peerInstance.on("signal", (data) => console.log("Signal Data:", data));

      peerInstance.on("stream", (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

      setPeer(peerInstance);
    }
  }, [streamUrl]);

  return (
    <div>
      <h2>Livestream</h2>
      {streamUrl ? (
        <video ref={videoRef} autoPlay playsInline controls />
      ) : (
        <p>Livestream not available</p>
      )}
    </div>
  );
};

export default LivestreamPage;

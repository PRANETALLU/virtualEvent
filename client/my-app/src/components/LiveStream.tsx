import React, { useEffect } from 'react';

interface LiveStreamProps {
  liveStreamUrl: string;
}

const LiveStream: React.FC<LiveStreamProps> = ({ liveStreamUrl }) => {
  useEffect(() => {
    // Set up WebRTC or any other streaming logic here
    // You can use Simple Peer for WebRTC setup
  }, []);

  return (
    <div>
      <h2>Live Stream</h2>
      <video id="liveStreamVideo" width="100%" controls autoPlay>
        <source src={liveStreamUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default LiveStream;

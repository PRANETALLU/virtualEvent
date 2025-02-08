import { useState } from "react";
import axios from "axios";

interface OrganizerDashboardProps {
  eventId: string;
}

const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ eventId }) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const startLivestream = async () => {
    try {
      const { data } = await axios.post<{ streamUrl: string }>(
        `http://localhost:5000/events/${eventId}/livestream/start`,
        {},
        { withCredentials: true }
      );
      setStreamUrl(data.streamUrl);
    } catch (error) {
      console.error("Failed to start livestream", error);
    }
  };

  const stopLivestream = async () => {
    try {
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/stop`, {}, { withCredentials: true });
      setStreamUrl(null);
    } catch (error) {
      console.error("Failed to stop livestream", error);
    }
  };

  return (
    <div>
      <h2>Livestream Controls</h2>
      {streamUrl ? (
        <p>
          Livestream URL: <a href={streamUrl} target="_blank" rel="noopener noreferrer">{streamUrl}</a>
        </p>
      ) : (
        <p>No active livestream</p>
      )}
      <button onClick={startLivestream}>Start Livestream</button>
      <button onClick={stopLivestream} disabled={!streamUrl}>Stop Livestream</button>
    </div>
  );
};

export default OrganizerDashboard;

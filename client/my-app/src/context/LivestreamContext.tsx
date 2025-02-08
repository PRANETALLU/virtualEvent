import { createContext, useState, useContext, ReactNode } from "react";
import axios from "axios";

interface LivestreamContextType {
  streamUrl: string | null;
  fetchLivestream: (eventId: string) => Promise<void>;
}

const LivestreamContext = createContext<LivestreamContextType | undefined>(undefined);

export const useLivestream = () => {
  const context = useContext(LivestreamContext);
  if (!context) {
    throw new Error("useLivestream must be used within a LivestreamProvider");
  }
  return context;
};

interface LivestreamProviderProps {
  children: ReactNode;
}

export const LivestreamProvider = ({ children }: LivestreamProviderProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const fetchLivestream = async (eventId: string) => {
    try {
      const { data } = await axios.get<{ liveStreamUrl: string }>(
        `http://localhost:5000/events/${eventId}/livestream`, 
        { withCredentials: true }
      );
      setStreamUrl(data.liveStreamUrl);
    } catch (err) {
      console.error("Livestream not found", err);
    }
  };

  return (
    <LivestreamContext.Provider value={{ streamUrl, fetchLivestream }}>
      {children}
    </LivestreamContext.Provider>
  );
};

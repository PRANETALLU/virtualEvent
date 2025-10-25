import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";

interface Event {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

const Recommendations: React.FC = () => {
  const { userInfo } = useUser();
  const [recommendations, setRecommendations] = useState<Event[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (userInfo?.id) {
        try {
          const { data } = await axios.get(
            `${API_URL}/user/${userInfo.id}/recommendations`,
            {
              headers: { Authorization: `Bearer ${userInfo.token}` },
            }
          );
          setRecommendations(data);
        } catch (error) {
          console.error("Error fetching recommendations:", error);
        }
      }
    };

    fetchRecommendations();
  }, [userInfo]);

  if (!userInfo) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recommended for You</h1>
      {recommendations.length > 0 ? (
        <ul className="space-y-4">
          {recommendations.map((event) => (
            <li key={event.id} className="p-4 border rounded shadow">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-gray-600">{event.description}</p>
              <div className="mt-2">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations available at the moment.</p>
      )}
    </div>
  );
};

export default Recommendations;
import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Button } from '@mui/material';
import { useUser } from '../context/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000", { withCredentials: true }); // Adjust the URL accordingly

const LiveStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [event, setEvent] = useState<any>(null); // Store event data
  const streamRef = useRef<MediaStream | null>(null);
  const { userInfo } = useUser();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Fetch event data when the component mounts
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const eventData = await response.json();
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Determine if the current user is the organizer
  const isOrganizer = event?.organizer?._id === userInfo?.id;

  // Handle the video stream for viewers
  useEffect(() => {
    if (isOrganizer || !event) return;

    // Attendees join the room and listen for the stream
    socket.emit("join-room", eventId);

    // Listen for the stream data from the organizer
    socket.on("receive-stream", (streamData: any) => {
      if (videoRef.current && streamData) {
        const mediaStream = new MediaStream();
        const videoTrack = streamData.getTracks()[0]; // Access the track from the MediaStream

        if (videoTrack) {
          mediaStream.addTrack(videoTrack);
          videoRef.current.srcObject = mediaStream;
        }
      }
    });

    // Cleanup the socket listener when the component unmounts or event changes
    return () => {
      socket.off("receive-stream");
    };
  }, [eventId, event, isOrganizer]);

  // Start streaming
  const startStreaming = async () => {
    try {
      // The organizer will share their webcam (audio/video)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreaming(true);

      // Emit the stream data to the server
      socket.emit("start-stream", { eventId, streamData: stream });

      // Handle stream ending via browser controls
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          stopStreaming();
        };
      });

      // Notify the server that the stream has started
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/start`, {}, { withCredentials: true });

    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  // Stop streaming
  const stopStreaming = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);

    try {
      // Notify the server to stop the stream
      await axios.post(`http://localhost:5000/events/${eventId}/livestream/stop`, {}, { withCredentials: true });
      navigate("/home"); // Navigate away after stopping the stream
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  };

  // Show loading indicator if event is not yet fetched
  if (!event) {
    return <div>Loading event...</div>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <Typography variant="h6">
          {isOrganizer ? 'Share Your Screen' : 'Live Stream View'}
        </Typography>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full bg-slate-900 rounded-lg aspect-video"
          />
          {isOrganizer && (
            <div className="flex justify-center">
              {!isStreaming ? (
                <Button onClick={startStreaming}>Start Streaming</Button>
              ) : (
                <Button onClick={stopStreaming}>
                  Stop Streaming
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStream;

import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Box,
  Chip,
  Avatar,
  IconButton,
  Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';


// Stream to be fixed
interface TrendingStream {
  _id: string;
  title: string;
  thumbnail: string;
  organizer: {
    _id: string;
    username: string;
    avatar?: string;
  };
  category: string;
  viewers: number;
  isLive: boolean;
}

const Misc: React.FC = () => {
  const [trendingStreams, setTrendingStreams] = useState<TrendingStream[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingStreams = async () => {
      try {
        const response = await axios.get('http://localhost:5000/events/trending');
        setTrendingStreams(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trending streams:', error);
        setLoading(false);
      }
    };

    fetchTrendingStreams();
  }, []);

  const handleStreamClick = (eventId: string) => {
    navigate(`/watch/${eventId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" fontWeight="bold">
          Trending Streams
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          // Actual content
          trendingStreams.map((stream) => (
            <Grid item xs={12} sm={6} md={4} key={stream._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleStreamClick(stream._id)}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'grey.300',
                    position: 'relative'
                  }}
                  image={stream.thumbnail || '/default-thumbnail.jpg'}
                >
                  {stream.isLive && (
                    <Chip
                      icon={<LiveTvIcon />}
                      label="LIVE"
                      color="error"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                  )}
                </CardMedia>
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {stream.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      src={stream.organizer.avatar} 
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {stream.organizer.username}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={stream.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {stream.viewers}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default Misc;
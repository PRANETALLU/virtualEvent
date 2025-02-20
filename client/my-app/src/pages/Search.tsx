import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Chip,
  InputAdornment,
  Grid,
  CircularProgress,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ComputerIcon from '@mui/icons-material/Computer';
import BusinessIcon from '@mui/icons-material/Business';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import EventCard from '../components/EventCard';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  price: number;
  category: string;
  organizer: {
    _id: string;
    username: string;
    email: string;
  };
  liveStreamUrl?: string;
  ended: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Category {
  id: string;
  name: string;
  Icon: React.ComponentType;
  color: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All Events', Icon: AllInclusiveIcon, color: '#757575' },
  { id: 'music', name: 'Music', Icon: MusicNoteIcon, color: '#2196F3' },
  { id: 'sports', name: 'Sports', Icon: SportsSoccerIcon, color: '#4CAF50' },
  { id: 'tech', name: 'Technology', Icon: ComputerIcon, color: '#9C27B0' },
  { id: 'business', name: 'Business', Icon: BusinessIcon, color: '#FF9800' },
  { id: 'arts', name: 'Arts & Theatre', Icon: TheaterComedyIcon, color: '#E91E63' },
  { id: 'food', name: 'Food & Drink', Icon: RestaurantIcon, color: '#FFC107' },
  { id: 'education', name: 'Education', Icon: SchoolIcon, color: '#F44336' }
];

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CategorySearch = () => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/events');
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let results = [...events];
    
    // Apply category filter
    if (selectedTab !== 0) { // 0 is "All Events"
      results = results.filter(event => event.category === categories[selectedTab].id);
    }

    // Apply search query
    if (searchQuery) {
      results = results.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEvents(results);
  }, [searchQuery, selectedTab, events]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getEventCountByCategory = (categoryId: string) => {
    return categoryId === 'all'
      ? events.length
      : events.filter(event => event.category === categoryId).length;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Discover Events
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find events that match your interests
        </Typography>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search for events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="event categories"
        >
          {categories.map((category, index) => {
            const CategoryIcon = category.Icon;
            return (
              <Tab
                key={category.id}
                icon={<CategoryIcon />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.name}
                    <Chip
                      size="small"
                      label={getEventCountByCategory(category.id)}
                      sx={{
                        backgroundColor: category.color,
                        color: 'white',
                        ml: 1,
                      }}
                    />
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        categories.map((category, index) => (
          <TabPanel key={category.id} value={selectedTab} index={index}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2">
                {filteredEvents.length} {category.name} Found
              </Typography>
            </Box>

            {filteredEvents.length > 0 ? (
              <Grid container spacing={3}>
                {filteredEvents.map((event) => (
                  <Grid item xs={12} sm={6} md={4} key={event._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                    >
                      <CardMedia
                        component="div"
                        sx={{
                          pt: '56.25%', // 16:9 aspect ratio
                          position: 'relative',
                          bgcolor: 'grey.200',
                        }}
                      >
                        <Chip
                          label={categories.find(c => c.id === event.category)?.name}
                          sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            bgcolor: categories.find(c => c.id === event.category)?.color,
                            color: 'white',
                          }}
                        />
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <EventCard {...event} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No events found in this category.
                </Typography>
                <Typography color="text.secondary">
                  Try adjusting your search or browse other categories.
                </Typography>
              </Box>
            )}
          </TabPanel>
        ))
      )}
    </Container>
  );
};

export default CategorySearch;
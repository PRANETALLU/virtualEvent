import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Tabs,
  Tab,
  Card,
  InputAdornment,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import GroupIcon from "@mui/icons-material/Group";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

interface Attendee {
  _id: string;
  username: string;
  email: string;
}

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
  attendees: Attendee[];
  liveStreamUrl?: string;
  ended: boolean;
}

interface Category {
  id: string;
  name: string;
  Icon: React.ComponentType;
  color: string;
}

const eventCategories = [
  "All", 
  "Music",
  "Arts",
  "Sports",
  "Tech",
  "Business",
  "Education",
  "Food",
  "Health",
  "Community",
  "Travel",
  "Gaming",
  "Other",
];

const categories: Category[] = eventCategories.map((category) => {
  let Icon;
  let color;

  switch (category.toLowerCase()) {
    case "all":
      Icon = AllInclusiveIcon; 
      color = "#757575";
      break; 
    case "music":
      Icon = MusicNoteIcon;
      color = "#2196F3";
      break;
    case "sports":
      Icon = SportsSoccerIcon;
      color = "#4CAF50";
      break;
    case "tech":
      Icon = ComputerIcon;
      color = "#9C27B0";
      break;
    case "business":
      Icon = BusinessIcon;
      color = "#FF9800";
      break;
    case "arts":
      Icon = TheaterComedyIcon;
      color = "#E91E63";
      break;
    case "food":
      Icon = RestaurantIcon;
      color = "#FFC107";
      break;
    case "education":
      Icon = SchoolIcon;
      color = "#F44336";
      break;
    case "health":
      Icon = HealthAndSafetyIcon;
      color = "#4CAF50";
      break;
    case "community":
      Icon = GroupIcon;
      color = "#00BCD4";
      break;
    case "travel":
      Icon = FlightTakeoffIcon;
      color = "#FF5722";
      break;
    case "gaming":
      Icon = SportsEsportsIcon;
      color = "#9E9E9E";
      break;
    case "other":
      Icon = AllInclusiveIcon;
      color = "#757575";
      break;
    default:
      Icon = AllInclusiveIcon;
      color = "#757575";
      break;
  }

  return {
    id: category.toLowerCase(),
    name: category,
    Icon,
    color,
  };
});

const Search = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

    if (selectedTab !== 0) {
      results = results.filter(event => {
        console.log('Test', event?.category, categories[selectedTab].id); // This will print the category of each event
        return event.category.toLowerCase() === categories[selectedTab].id;
      });
    }

    if (searchQuery) {
      results = results.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priceFilter !== 'all') {
      results = results.filter(event => 
        priceFilter === 'free' ? event.price === 0 : event.price > 0
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      results = results.filter(event =>
        dateFilter === 'upcoming'
          ? new Date(event.dateTime) >= now
          : new Date(event.dateTime) < now
      );
    }

    if (statusFilter !== 'all') {
      const status = statusFilter === 'true';
      results = results.filter(event => event.ended === status);
    }

    setFilteredEvents(results);
  }, [searchQuery, selectedTab, priceFilter, dateFilter, statusFilter, events]);

  const handleDeleteEvent = async (deletedEventId: string) => {
    try {
      await axios.delete(`http://localhost:5000/events/${deletedEventId}`, { withCredentials: true });
      setEvents(prevEvents => prevEvents.filter(event => event._id !== deletedEventId));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: 100 }}>
      <Typography variant="h4" gutterBottom align="center">
        Discover Events
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search events..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box display="flex" gap={2} mb={2} justifyContent="center">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel sx={{ top: -8 }}>Price</InputLabel>
          <Select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="free">Free</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel sx={{ top: -8 }}>Date</InputLabel>
          <Select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="past">Past</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel sx={{ top: -8 }}>Status</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Ended</MenuItem>
            <MenuItem value="false">Upcoming</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {categories.map((category, index) => (
          <Tab
            key={category.id}
            label={category.name}
            icon={<category.Icon />}
            iconPosition="start"
            sx={{ color: category.color }}
          />
        ))}
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={3}>
          {filteredEvents.map(event => (
            <Card key={event._id} sx={{ width: 320 }}>
              <EventCard {...event} onDelete={handleDeleteEvent} />
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Search;

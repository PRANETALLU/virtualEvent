import React from "react";
import { Container, Typography, Box, Paper, Grid, Card, CardContent, Divider, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import StreamIcon from "@mui/icons-material/Stream";
import GroupIcon from "@mui/icons-material/Group";
import ChatIcon from "@mui/icons-material/Chat";
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const About: React.FC = () => {
  const features = [
    {
      icon: <EventIcon sx={{ fontSize: 40, color: "#2196F3" }} />,
      title: "Event Management",
      description: "Create and manage virtual events with ease. Set event details, manage attendees, and track engagement. Schedule events, send invitations, and monitor participation in real-time."
    },
    {
      icon: <StreamIcon sx={{ fontSize: 40, color: "#4CAF50" }} />,
      title: "Live Streaming",
      description: "High-quality WebRTC-based live streaming with real-time video and audio broadcasting. Support for multiple participants, screen sharing, and adaptive bitrate streaming."
    },
    {
      icon: <GroupIcon sx={{ fontSize: 40, color: "#9C27B0" }} />,
      title: "Community",
      description: "Connect with like-minded individuals, participate in events, and build meaningful relationships. Create profiles, join interest groups, and network with other participants."
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40, color: "#FF9800" }} />,
      title: "Real-time Interaction",
      description: "Engage with participants through real-time chat, polls, Q&A sessions, and interactive features. Support for emoji reactions, file sharing, and private messaging."
    }
  ];

  const benefits = [
    {
      title: "High Performance",
      description: "Optimized for low latency and high-quality streaming",
      icon: <SpeedIcon color="primary" />
    },
    {
      title: "Cross-Platform",
      description: "Works seamlessly across desktop and mobile devices",
      icon: <DevicesIcon color="primary" />
    },
    {
      title: "Secure",
      description: "End-to-end encryption and secure authentication",
      icon: <SecurityIcon color="primary" />
    }
  ];

  return (
    <Box sx={{ 
      minHeight: "100vh",
      bgcolor: "background.default",
      pt: { xs: 10, md: 12 },
      pb: 8
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              backgroundClip: "text",
              textFillColor: "transparent",
              mb: 3
            }}
          >
            Virtual Event Platform
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Connect, Create, and Collaborate in Real-Time
          </Typography>
          <Divider sx={{ my: 4 }} />
        </Box>

        {/* Mission Statement */}
        <Paper elevation={3} sx={{ p: 4, mb: 8, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: "medium" }}>
            Our Mission
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We're revolutionizing the way people connect and interact virtually. Our platform 
            provides a seamless experience for organizing and attending virtual events, making 
            it easier than ever to bring people together regardless of physical location.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Why Choose Our Platform?
            </Typography>
            <List>
              {benefits.map((benefit, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {benefit.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={benefit.title}
                    secondary={benefit.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Features Grid */}
        <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card 
                sx={{ 
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom align="center">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Technology Stack */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: "medium" }}>
            Built with Modern Technology
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                Frontend Technologies
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="React.js with TypeScript"
                    secondary="Modern, type-safe frontend development"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Material-UI Components"
                    secondary="Sleek, responsive design system"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="WebRTC Integration"
                    secondary="High-quality real-time communication"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="WebSocket Client"
                    secondary="Real-time data synchronization"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                Backend Infrastructure
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Node.js/Express.js"
                    secondary="Scalable server architecture"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="MongoDB Database"
                    secondary="Flexible data storage and retrieval"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="WebSocket Server"
                    secondary="Bi-directional real-time communication"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="JWT Authentication"
                    secondary="Secure user authentication and authorization"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default About;
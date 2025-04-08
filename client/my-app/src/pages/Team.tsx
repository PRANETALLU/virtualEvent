import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Avatar, Box, Chip, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

interface TeamMember {
  name: string;
  role: string[];
  image: string;
  bio: string;
  linkedin?: string;
  github?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Tommy',
    role: ['UI/UX Designer', 'Frontend Developer'],
    image: '/team/tommy.jpg', // Add actual image path
    bio: 'Passionate about creating intuitive and beautiful user experiences. Specializes in modern web design and React development.',
    linkedin: '#',
    github: '#'
  },
  {
    name: 'Ansh',
    role: ['Backend Developer', 'Frontend Developer'],
    image: '/team/ansh.jpg', // Add actual image path
    bio: 'Full-stack developer with expertise in Node.js and React. Focused on building scalable and efficient backend solutions.',
    linkedin: '#',
    github: '#'
  },
  {
    name: 'Nikhil',
    role: ['Frontend Developer'],
    image: '/team/nikhil.jpg', // Add actual image path
    bio: 'Frontend specialist with a keen eye for detail. Experienced in building responsive and interactive web applications.',
    linkedin: '#',
    github: '#'
  },
  {
    name: 'Pranet',
    role: ['Frontend Developer', 'Backend Developer'],
    image: '/team/pranet.jpg', // Add actual image path
    bio: 'Full-stack developer passionate about creating seamless user experiences and robust backend systems.',
    linkedin: '#',
    github: '#'
  }
];

const Team: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 8, md: 12 },
        px: 2
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box textAlign="center" mb={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              mb: 2
            }}
          >
            Meet Our Team
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            The talented people behind the virtual event platform
          </Typography>
        </Box>

        {/* Team Grid */}
        <Grid container spacing={4} justifyContent="center">
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Avatar
                    src={member.image}
                    alt={member.name}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      border: 3,
                      borderColor: 'primary.main'
                    }}
                  />
                  <Typography variant="h5" component="h2" gutterBottom>
                    {member.name}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {member.role.map((role, idx) => (
                      <Chip
                        key={idx}
                        label={role}
                        sx={{
                          m: 0.5,
                          backgroundColor: (theme) =>
                            idx % 2 === 0 ? theme.palette.primary.light : theme.palette.secondary.light
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {member.bio}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {member.linkedin && (
                      <IconButton
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                      >
                        <LinkedInIcon />
                      </IconButton>
                    )}
                    {member.github && (
                      <IconButton
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="primary"
                      >
                        <GitHubIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Team;
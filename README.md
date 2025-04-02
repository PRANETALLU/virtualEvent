# Virtual Event Platform

## Senior Project Spring 2025
A comprehensive virtual event platform enabling real-time interaction, event management, and live streaming capabilities.

## Project Overview
This platform addresses the growing need for virtual event solutions, providing a seamless experience for event organizers and attendees. Built with modern web technologies, it offers features like live streaming, real-time chat, and event management tools.

## User Stories

### Event Organizers
- As an event organizer, I want to create and manage virtual events
- As an organizer, I want to set event details (title, description, date, time)
- As an organizer, I want to control who can attend my events
- As an organizer, I want to track event attendance
- As an organizer, I want to manage live streaming settings
- As an organizer, I want to view analytics about my events

### Event Attendees
- As an attendee, I want to browse available events
- As an attendee, I want to register for events
- As an attendee, I want to participate in live streams
- As an attendee, I want to interact with other participants via chat
- As an attendee, I want to view my upcoming and past events
- As an attendee, I want to receive recommendations for events

### Platform Features

#### Event Management
- Create and manage virtual events
- Set event details (title, description, date, time, venue)
- Categorize events (Music, Arts, Sports, Tech, etc.)
- Price setting (free or paid events)
- Event analytics and reporting
- Attendee management

#### Live Streaming
- WebRTC-based live streaming
- Real-time video and audio broadcasting
- Screen sharing capabilities
- Stream quality management
- Recording capabilities
- Chat moderation tools

#### User Features
- User authentication and authorization
- Profile management
- Event attendance tracking
- Personalized event recommendations
- Payment integration for paid events
- Social sharing capabilities

## Technology Stack

### Frontend
- React.js with TypeScript
- Material-UI (MUI) for UI components
- WebRTC for live streaming
- Socket.io for real-time communication
- Redux for state management
- Axios for API requests

### Backend
- Node.js/Express.js
- MongoDB for database
- Socket.io for WebSocket server
- JWT for authentication
- AWS S3 for media storage
- Redis for caching

## Directory

# Front-end pages

1. Welcome/
   - Welcome.tsx (Landing page)

2. Auth/
   - Login.tsx
   - Signup.tsx

3. Events/
   - Home.tsx (Dashboard)
   - EventDetails.tsx
   - Search.tsx
   - LiveStream.tsx

4. User/
   - Profile.tsx
   - Recommendations.tsx

5. Payments/
   - Payments.tsx

6. Notifications/
   - Notifications.tsx

# Back-end routes

1. userRoutes/
   - Authentication
   - Profile management
   - User preferences

2. eventRoutes/
   - Event CRUD operations
   - Attendee management
   - Live streaming endpoints

3. paymentRoutes/
   - Payment processing
   - Transaction history

4. notificationRoutes/
   - User notifications
   - Event reminders

# Core Files

1. App.tsx (Root application component)
2. index.html (Entry point)
3. UserContext.tsx (User authentication context)
4. Components/
   - Header.tsx
   - EventCard.tsx
   - Chat.tsx


# shared components

1. Layout/
   - Header
   - Navigation
   - Footer

2. UI Components/
   - Forms
   - Cards
   - Buttons
   - Loading states

## Getting Started

### Prerequisites
```bash
# Required software
- Node.js (v14 or higher)
- MongoDB
- Redis
- npm or yarn
```

### Installation
```bash
# Clone the repository
git clone https://github.com/PRANETALLU/virtualEvent.git
cd virtualEvent

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd client/my-app
npm install
```

### Environment Setup
```bash
# Create .env file in server directory
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
CORS_ORIGIN=http://localhost:5173
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
REDIS_URL=your_redis_url
```

## Project Timeline
- **Sprint 1**: User Authentication & Basic UI (2 weeks)
- **Sprint 2**: Event Management Features (3 weeks)
- **Sprint 3**: Live Streaming Implementation (4 weeks)
- **Sprint 4**: Chat & Interactive Features (3 weeks)
- **Sprint 5**: Testing & Refinement (2 weeks)

## Development Team
- Tommy Lam Luu: UI/UX Designer, Front End Dev


## Testing
```bash
# Run frontend tests
cd client/my-app
npm test

# Run backend tests
cd server
npm test
```

## Deployment
- Frontend deployed on Vercel
- Backend deployed on AWS EC2
- Database hosted on MongoDB Atlas
- Media storage on AWS S3

## Monitoring & Analytics
- Application monitoring with New Relic
- Error tracking with Sentry
- User analytics with Google Analytics

## Future Enhancements
1. Mobile application development
2. Advanced analytics dashboard
3. AI-powered event recommendations
4. Virtual reality integration
5. Breakout room functionality


## Acknowledgments
- Faculty Advisor: [Name]

## Contact
For any inquiries, please contact:
- Faculty Advisor: [Email]
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import UserContextProvider from './context/UserContext';
import OrganizerDashboard from "./components/OrganizerDashboard";
import LiveStream from "./pages/LiveStream";
import Welcome from "./pages/Welcome";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserContextProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />\
          <Route path="/home" element={<Home />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/organizer/:eventId" element={<OrganizerDashboard eventId="123" />} />
          <Route path="/watch/:eventId" element={<LiveStream />} />
        </Routes>
      </UserContextProvider>
    </BrowserRouter>
  );
};

export default App;

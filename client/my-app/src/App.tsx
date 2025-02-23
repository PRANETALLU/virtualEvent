import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserContextProvider from './context/UserContext';
import LiveStream from "./pages/LiveStream";
import Welcome from "./pages/Welcome";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import { Header } from "./components/Header";
import Search from "./pages/Search";
import LStream from "./pages/LStream";
import Profile from "./pages/Profile";
import Payments from './pages/Payments';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserContextProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/watch/:eventId" element={<LiveStream />} />
          <Route path="/lStream" element={<LStream />} />
          <Route path="/profile" element={<Profile />} />
          <Route 
            path="/payments" 
            element={
              <Elements stripe={stripePromise}>
                <Payments />
              </Elements>
            } 
          />
        </Routes>
      </UserContextProvider>
    </BrowserRouter>
  );
};

export default App;

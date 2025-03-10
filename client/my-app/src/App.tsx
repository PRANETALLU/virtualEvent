import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import UserContextProvider, { useUser } from './context/UserContext';
import LiveStream from "./pages/LiveStream";
import Welcome from "./pages/Welcome";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EventDetails from "./pages/EventDetails";
import { Header } from "./components/Header";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Payments from './pages/Payments';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { userInfo } = useUser();
  return userInfo ? children : <Navigate to="/login" />;
};

const RedirectRoute = ({ children }: { children: JSX.Element }) => {
  const { userInfo } = useUser();
  return userInfo ? <Navigate to="/home" /> : children;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserContextProvider>
        <Header />
        <Routes>
          {/* Redirect if logged in */}
          <Route path="/" element={<RedirectRoute><Welcome /></RedirectRoute>} />
          <Route path="/signup" element={<RedirectRoute><Signup /></RedirectRoute>} />
          <Route path="/login" element={<RedirectRoute><Login /></RedirectRoute>} />

          {/* Protected routes */}
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/events/:eventId" element={<PrivateRoute><EventDetails /></PrivateRoute>} />
          <Route path="/watch/:eventId" element={<PrivateRoute><LiveStream /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/*Wrapper */}
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <Elements stripe={stripePromise}>
                  <Payments />
                </Elements>
              </PrivateRoute>
            }
          />
        </Routes>
      </UserContextProvider>
    </BrowserRouter>
  );
};

export default App;

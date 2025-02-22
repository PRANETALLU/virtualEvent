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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserContextProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />\
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/watch/:eventId" element={<LiveStream />} />
          <Route path="/lStream" element={<LStream />} />
        </Routes>
      </UserContextProvider>
    </BrowserRouter>
  );
};

export default App;

import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import { LivestreamProvider } from "./context/LivestreamContext";
import OrganizerDashboard from "./components/OrganizerDashboard";
import LivestreamPage from "./pages/LivestreamPage";
import Welcome from "./pages/Welcome";

const App: React.FC = () => {
  return (
    <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />}/>
            <Route path="/organizer/:eventId" element={<OrganizerDashboard eventId="123" />} />
            <Route path="/watch/:eventId" element={<LivestreamPage />} />
          </Routes>
    </BrowserRouter>
  );
};

export default App;

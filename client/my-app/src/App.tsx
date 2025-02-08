import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LivestreamProvider } from "./context/LivestreamContext";
import OrganizerDashboard from "./components/OrganizerDashboard";
import LivestreamPage from "./pages/LivestreamPage";

const App: React.FC = () => {
  return (
    <LivestreamProvider>
      <Router>
        <Routes>
          <Route path="/organizer/:eventId" element={<OrganizerDashboard eventId="123" />} />
          <Route path="/watch/:eventId" element={<LivestreamPage />} />
        </Routes>
      </Router>
    </LivestreamProvider>
  );
};

export default App;

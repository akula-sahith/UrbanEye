import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import SocketTest from "./components/socketTest";
import Register from "./components/register";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Assistant from "./components/Assistant";
import './App.css';
function App() {
  return (
    <>
    {/* <SocketTest/> */}
    <Router>
      <Routes>
        {/* 🔥 Main Application Pages */}
        <Route path="/map" element={<MapView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/register" element={<Register />} />

        {/* 🔧 Optional debug page */}
        <Route path="/socket" element={<SocketTest />} />

        {/* 🏠 Landing page */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
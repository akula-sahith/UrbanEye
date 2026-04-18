import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import SocketTest from "./components/socketTest";
import Register from "./components/register";
import LandingPage from "./components/LandingPage";
import './App.css';
function App() {
  return (
    <>
    {/* <SocketTest/> */}
    <Router>
      <Routes>
        {/* 🔥 Map page */}
        <Route path="/map" element={<MapView />} />
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
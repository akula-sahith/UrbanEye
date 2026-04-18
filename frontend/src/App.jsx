import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import SocketTest from "./components/socketTest";
import Register from "./components/register";
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

        {/* 🏠 Default route */}
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
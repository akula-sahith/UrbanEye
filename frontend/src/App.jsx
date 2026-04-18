import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import SocketTest from "./components/socketTest";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔥 Map page */}
        <Route path="/map" element={<MapView />} />

        {/* 🔧 Optional debug page */}
        <Route path="/socket" element={<SocketTest />} />

        {/* 🏠 Default route */}
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </Router>
  );
}

export default App;
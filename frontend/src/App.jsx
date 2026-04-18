import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [80.6480, 16.5062], // Vijayawada coordinates [lng, lat]
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
}

export default App;

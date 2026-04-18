import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './LandingPage.css';

/* ── Camera presets ──────────────────────── */
const VIJAYAWADA = [80.6480, 16.5062];

const LANDING_VIEW = {
  center: VIJAYAWADA,
  zoom: 11,
  pitch: 82,
  bearing: -15,
};

const CITY_VIEW = {
  center: VIJAYAWADA,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

/* ── Component ───────────────────────────── */
export default function LandingPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const rotationFrame = useRef(null);
  const navigate = useNavigate();
  const [fading, setFading] = useState(false);

  /* Slow auto-rotate for cinematic feel */
  const startRotation = useCallback(() => {
    let bearing = LANDING_VIEW.bearing;
    const rotate = () => {
      if (!map.current) return;
      bearing += 0.015;
      map.current.setBearing(bearing);
      rotationFrame.current = requestAnimationFrame(rotate);
    };
    rotationFrame.current = requestAnimationFrame(rotate);
  }, []);

  const stopRotation = useCallback(() => {
    if (rotationFrame.current) {
      cancelAnimationFrame(rotationFrame.current);
      rotationFrame.current = null;
    }
  }, []);

  /* Initialise Mapbox once */
  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: LANDING_VIEW.center,
      zoom: LANDING_VIEW.zoom,
      pitch: LANDING_VIEW.pitch,
      bearing: LANDING_VIEW.bearing,
      interactive: false,
      attributionControl: false,
      antialias: true,
    });

    map.current.on('style.load', () => {
      /* Add 3-D terrain */
      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      /* ── FOG & SKY REMOVED ──────────────────
         These were causing the white/blue wash
         over the top portion of the map.
      ────────────────────────────────────────── */

      /* Start slow rotation after map loads */
      startRotation();
    });

    return () => {
      stopRotation();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [startRotation, stopRotation]);

  /* ── Handlers ──────────────────────────── */
  const handleGoToCity = () => {
    if (!map.current || fading) return;

    stopRotation();
    setFading(true);

    map.current.setTerrain(null);
    if (map.current.getLayer('sky')) map.current.removeLayer('sky');

    map.current.flyTo({
      center: CITY_VIEW.center,
      zoom: CITY_VIEW.zoom,
      pitch: CITY_VIEW.pitch,
      bearing: CITY_VIEW.bearing,
      speed: 0.6,
      curve: 1.8,
      easing: (t) => t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2,
      essential: true,
    });

    map.current.once('moveend', () => {
      navigate('/map');
    });
  };

  const handleRegister = () => {
    navigate('/register');
  };

  /* ── Render ────────────────────────────── */
  return (
    <div className="landing-wrapper">
      {/* Map background */}
      <div ref={mapContainer} className="landing-map" />

      {/* Bottom vignette — hidden via CSS */}
      <div className="landing-vignette" />

      {/* Hero overlay */}
      <div className={`landing-overlay ${fading ? 'fade-out' : ''}`}>
        <div className="landing-content">
          <p className="landing-subtitle">Smart City Dashboard</p>
          <h1 className="landing-title">URBAN EYE</h1>

          <div className="landing-buttons">
            <button
              id="btn-go-to-city"
              className="landing-btn landing-btn--city"
              onClick={handleGoToCity}
            >
              Go to City
              <span className="landing-btn-icon">→</span>
            </button>

            <button
              id="btn-register-event"
              className="landing-btn landing-btn--register"
              onClick={handleRegister}
            >
              <span className="landing-btn-icon">📌</span>
              Register Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';
import { addTrafficLayer } from './TrafficLayer.js';

const VIJAYAWADA_CENTER = [80.6480, 16.5062];
const LOCK_RADIUS_METERS = 17000;
const MAX_BOUNDS = [
  [80.26, 16.10],
  [81.06, 16.92]
];

function createCircle(center, radiusMeters, steps = 128) {
  const [lng, lat] = center;
  const coordinates = [];
  const earthRadius = 6371000;

  for (let i = 0; i <= steps; i += 1) {
    const angle = (i * Math.PI * 2) / steps;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const deltaLng = (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const deltaLat = (dy / earthRadius) * (180 / Math.PI);
    coordinates.push([lng + deltaLng, lat + deltaLat]);
  }

  return coordinates;
}

function createMaskGeoJSON(center) {
  const outerRing = [
    [-180, 90],
    [180, 90],
    [180, -90],
    [-180, -90],
    [-180, 90]
  ];
  const innerRing = createCircle(center, LOCK_RADIUS_METERS);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [outerRing, innerRing]
    }
  };
}

function createLockPoints(center, radiusMeters, count = 16) {
  const [lng, lat] = center;
  const earthRadius = 6371000;
  const lockRadius = radiusMeters * 1.5;
  const points = [];

  for (let i = 0; i < count; i += 1) {
    const angle = (i * Math.PI * 2) / count;
    const dx = lockRadius * Math.cos(angle);
    const dy = lockRadius * Math.sin(angle);
    const deltaLng = (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const deltaLat = (dy / earthRadius) * (180 / Math.PI);
    points.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng + deltaLng, lat + deltaLat]
      },
      properties: {
        icon: '🔒'
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features: points
  };
}

function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAP_BOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: VIJAYAWADA_CENTER,
      zoom: 12,
      maxBounds: MAX_BOUNDS,
      minZoom: 10,
      maxZoom: 15,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      map.current.addSource('lock-mask', {
        type: 'geojson',
        data: createMaskGeoJSON(VIJAYAWADA_CENTER)
      });

      map.current.addLayer({
        id: 'lock-mask-fill',
        type: 'fill',
        source: 'lock-mask',
        paint: {
          'fill-color': '#4b5563',
          'fill-opacity': 0.55
        }
      });

      map.current.addSource('lock-icons', {
        type: 'geojson',
        data: createLockPoints(VIJAYAWADA_CENTER, LOCK_RADIUS_METERS)
      });

      map.current.addLayer({
        id: 'lock-icons-layer',
        type: 'symbol',
        source: 'lock-icons',
        layout: {
          'text-field': ['get', 'icon'],
          'text-size': 26,
          'text-anchor': 'center'
        }
      });

      addTrafficLayer(map.current);
    });
  }, []);

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default MapView;

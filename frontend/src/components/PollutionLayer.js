import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

const AQI_COLORS = {
  0: '#00e400',   // Good
  50: '#ffff00',  // Moderate
  100: '#ff7e00', // Unhealthy for sensitive
  150: '#ff0000', // Unhealthy
  200: '#8f3f97', // Very unhealthy
  300: '#7e0023'  // Hazardous
};

function getAQIColor(aqi) {
  if (aqi <= 50) return AQI_COLORS[0];
  if (aqi <= 100) return AQI_COLORS[50];
  if (aqi <= 150) return AQI_COLORS[100];
  if (aqi <= 200) return AQI_COLORS[150];
  if (aqi <= 300) return AQI_COLORS[200];
  return AQI_COLORS[300];
}

export function addPollutionLayer(map) {
  const socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('Connected to backend socket');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from backend socket');
  });

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  let pollutionSource = null;

  socket.on('pollution:update', (data) => {
    console.log('Pollution data received:', data);

    if (!data || data.length === 0) {
      console.log('No pollution data');
      return;
    }

    const features = data.map(point => {
      const color = getAQIColor(point.aqi);
      console.log(`Point: lat=${point.lat}, lon=${point.lon}, aqi=${point.aqi}, color=${color}`);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat]
        },
        properties: {
          aqi: point.aqi,
          co: point.components.co,
          no2: point.components.no2,
          o3: point.components.o3,
          pm2_5: point.components.pm2_5,
          pm10: point.components.pm10,
          so2: point.components.so2,
          color: color
        }
      };
    });

    console.log('Features created:', features.length);

    const geojson = {
      type: 'FeatureCollection',
      features: features
    };

    if (pollutionSource) {
      map.getSource('pollution').setData(geojson);
    } else {
      map.addSource('pollution', {
        type: 'geojson',
        data: geojson
      });

      // Circle layer with color fade effect
      map.addLayer({
        id: 'pollution-circles',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 8,
            18, 20
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8
        }
      });

      pollutionSource = true;
    }
  });

  // Hover events for pollution circles
  map.on('mousemove', 'pollution-circles', (e) => {
    const feature = e.features[0];
    const props = feature.properties;
    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 12px;">
        <strong>AQI:</strong> ${props.aqi}<br>
        <strong>PM2.5:</strong> ${props.pm2_5} µg/m³<br>
        <strong>PM10:</strong> ${props.pm10} µg/m³<br>
        <strong>CO:</strong> ${props.co} ppm<br>
        <strong>NO₂:</strong> ${props.no2} ppb<br>
        <strong>O₃:</strong> ${props.o3} ppb<br>
        <strong>SO₂:</strong> ${props.so2} ppb
      </div>
    `;
    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'pollution-circles', () => {
    popup.remove();
    map.getCanvas().style.cursor = '';
  });

  return socket;
}
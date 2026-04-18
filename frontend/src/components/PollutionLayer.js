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
  const socket = io('http://13.53.182.223');

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

  // Create AQI card element
  const aqiCard = document.createElement('div');
  aqiCard.id = 'aqi-card';
  aqiCard.style.position = 'absolute';
  aqiCard.style.top = '20px';
  aqiCard.style.left = '20px';
  aqiCard.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  aqiCard.style.padding = '15px 20px';
  aqiCard.style.borderRadius = '8px';
  aqiCard.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  aqiCard.style.zIndex = '1000';
  aqiCard.style.fontFamily = 'Arial, sans-serif';
  aqiCard.style.minWidth = '150px';
  
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(aqiCard);
  }

  let pollutionSource = null;

  socket.on('pollution:update', (data) => {
    console.log('Pollution data received:', data);

    if (!data || data.length === 0) {
      console.log('No pollution data');
      return;
    }

    // Calculate average AQI
    const averageAQI = Math.round(
      data.reduce((sum, point) => sum + point.aqi, 0) / data.length
    );
    
    // Update AQI card
    aqiCard.innerHTML = `
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Average AQI</div>
      <div style="font-size: 28px; font-weight: bold; color: ${getAQIColor(averageAQI)};">
        ${averageAQI}
      </div>
    `;

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

      // Layer 1: Outer fade (30km radius with very low opacity)
      map.addLayer({
        id: 'pollution-fade-3',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 300,
            18, 700
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.04,
          'circle-blur': 1
        }
      });

      // Layer 2: Mid fade (20km radius with low-medium opacity)
      map.addLayer({
        id: 'pollution-fade-2',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 200,
            18, 467
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.08,
          'circle-blur': 1
        }
      });

      // Layer 3: Center glow (1km radius with medium opacity)
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
          'circle-opacity': 0.4,
          'circle-blur': 0.5
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
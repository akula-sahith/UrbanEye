import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

const AQI_COLORS = {
  0:   '#00e400',
  50:  '#ffff00',
  100: '#ff7e00',
  150: '#ff0000',
  200: '#8f3f97',
  300: '#7e0023'
};

function getAQIColor(aqi) {
  if (aqi <= 50)  return AQI_COLORS[0];
  if (aqi <= 100) return AQI_COLORS[50];
  if (aqi <= 150) return AQI_COLORS[100];
  if (aqi <= 200) return AQI_COLORS[150];
  if (aqi <= 300) return AQI_COLORS[200];
  return AQI_COLORS[300];
}

export function addPollutionLayer(map) {
  const socket = io('https://urbaneye-jepe.onrender.com');

  socket.on('connect',    () => console.log('✅ Pollution layer connected'));
  socket.on('disconnect', () => console.log('Pollution layer disconnected'));

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  let pollutionSourceAdded = false;

  /* ── Sidebar toggle listener ───────────────────────── */
  window.addEventListener('citymap:toggle', (e) => {
    if (e.detail.layer !== 'pollution') return;
    togglePollutionLayers(map, e.detail.visible);
  });

  /* ── Pollution data handler ──────────────────────── */
  socket.on('pollution:update', (data) => {
    if (!data || data.length === 0) return;

    const features = data.map((point) => {
      const color = getAQIColor(point.aqi);
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lon, point.lat]
        },
        properties: {
          aqi:   point.aqi,
          co:    point.components.co,
          no2:   point.components.no2,
          o3:    point.components.o3,
          pm2_5: point.components.pm2_5,
          pm10:  point.components.pm10,
          so2:   point.components.so2,
          color
        }
      };
    });

    const geojson = { type: 'FeatureCollection', features };

    if (!pollutionSourceAdded) {
      map.addSource('pollution', { type: 'geojson', data: geojson });

      // Outer fade — wide halo
      map.addLayer({
        id: 'pollution-fade-3',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 300,
            18, 700
          ],
          'circle-color':   ['get', 'color'],
          'circle-opacity': 0.04,
          'circle-blur':    1
        }
      });

      // Mid fade
      map.addLayer({
        id: 'pollution-fade-2',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 200,
            18, 467
          ],
          'circle-color':   ['get', 'color'],
          'circle-opacity': 0.08,
          'circle-blur':    1
        }
      });

      // Centre glow
      map.addLayer({
        id: 'pollution-circles',
        type: 'circle',
        source: 'pollution',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 8,
            18, 20
          ],
          'circle-color':   ['get', 'color'],
          'circle-opacity': 0.4,
          'circle-blur':    0.5
        }
      });

      // Hover popup
      map.on('mousemove', 'pollution-circles', (e) => {
        const props = e.features[0].properties;
        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">
              <strong>AQI:</strong> ${props.aqi}<br>
              <strong>PM2.5:</strong> ${Number(props.pm2_5).toFixed(1)} µg/m³<br>
              <strong>PM10:</strong>  ${Number(props.pm10).toFixed(1)}  µg/m³<br>
              <strong>CO:</strong>    ${Number(props.co).toFixed(2)}    ppm<br>
              <strong>NO₂:</strong>  ${Number(props.no2).toFixed(2)}   ppb<br>
              <strong>O₃:</strong>   ${Number(props.o3).toFixed(2)}    ppb<br>
              <strong>SO₂:</strong>  ${Number(props.so2).toFixed(2)}   ppb
            </div>
          `)
          .addTo(map);
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'pollution-circles', () => {
        popup.remove();
        map.getCanvas().style.cursor = '';
      });

      pollutionSourceAdded = true;
    } else {
      map.getSource('pollution').setData(geojson);
    }
  });

  /* ── Layer visibility helper ─────────────────────── */
  function togglePollutionLayers(map, visible) {
    ['pollution-fade-3', 'pollution-fade-2', 'pollution-circles'].forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
  }

  return socket;
}
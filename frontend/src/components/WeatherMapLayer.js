import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

function createWeatherPinElement(temp, conditionMain) {
  const size = 36;
  const wrapper = document.createElement('div');
  wrapper.className = 'weather-marker';
  Object.assign(wrapper.style, {
    width:  `${size}px`,
    height: `${size + 10}px`,
    cursor: 'pointer',
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
  });

  const icon = conditionMain === 'Rain' ? '🌧' :
               conditionMain === 'Clouds' ? '☁️' :
               conditionMain === 'Clear' ? '☀️' :
               conditionMain === 'Drizzle' ? '🌦' :
               conditionMain === 'Thunderstorm' ? '⛈' :
               conditionMain === 'Snow' ? '❄️' :
               conditionMain === 'Mist' || conditionMain === 'Fog' ? '🌫' : '🌡';

  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${size}" height="${size + 10}"
         viewBox="0 0 36 46">
      <defs>
        <linearGradient id="wp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38bdf8"/>
          <stop offset="100%" style="stop-color:#0284c7"/>
        </linearGradient>
      </defs>
      <path d="M18 2
               C10.268 2 4 8.268 4 16
               C4 24.5 18 44 18 44
               C18 44 32 24.5 32 16
               C32 8.268 25.732 2 18 2Z"
            fill="url(#wp-grad)" stroke="#0369a1" stroke-width="1"/>
      <circle cx="18" cy="16" r="7" fill="#ffffff" opacity="0.25"/>
      <circle cx="18" cy="16" r="4" fill="#ffffff"/>
    </svg>
    <div style="position:absolute;top:6px;left:0;width:100%;text-align:center;
                font-size:16px;line-height:1;pointer-events:none;">
      ${icon}
    </div>
  `;

  return wrapper;
}

export function addWeatherMapLayer(map) {
  const socket = io('https://urbaneye-jepe.onrender.com');

  socket.on('connect', () => {
    console.log('✅ [WeatherMapLayer] Weather layer connected');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ [WeatherMapLayer] Weather layer disconnected');
  });

  const markers = [];
  let weatherVisible = true;

  /* ── Sidebar toggle listener ───────────────────────── */
  window.addEventListener('citymap:toggle', (e) => {
    if (e.detail.layer !== 'weather') return;
    weatherVisible = e.detail.visible;
    markers.forEach((m) => {
      const el = m.getElement();
      el.style.display = weatherVisible ? '' : 'none';
    });
  });

  /* ── Weather marker handler ────────────────────────── */
  socket.on('weather:update', (data) => {
    console.log('📍 [WeatherMapLayer] weather:update event received:', data);
    updateWeatherMarkers(data);
  });

  function updateWeatherMarkers(data) {
    console.log('📊 [WeatherMapLayer] Processing weather data, array length:', Array.isArray(data) ? data.length : 'not an array');
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ [WeatherMapLayer] No data or not an array');
      return;
    }

    // Clear existing markers
    console.log('📊 [WeatherMapLayer] Removing', markers.length, 'old markers');
    markers.forEach((m) => m.remove());
    markers.length = 0;

    // Group weather points by coordinate to detect stacking
    const coordMap = {};
    data.forEach((point) => {
      const key = [point.lon, point.lat].join(',');
      if (!coordMap[key]) coordMap[key] = [];
      coordMap[key].push(point);
    });

    console.log('📊 [WeatherMapLayer] Creating', data.length, 'weather markers from', Object.keys(coordMap).length, 'unique coordinates');

    data.forEach((point) => {
      const key = [point.lon, point.lat].join(',');
      const group = coordMap[key];
      const indexInGroup = group.indexOf(point);

      let lon = point.lon;
      let lat = point.lat;

      // Offset overlapping markers slightly so all are visible
      if (group.length > 1) {
        const angle  = (indexInGroup / group.length) * 2 * Math.PI;
        const offset = 0.0003;
        lon += Math.cos(angle) * offset;
        lat += Math.sin(angle) * offset;
      }

      const temp = point.main?.temp || 0;
      const conditionMain = point.condition?.main || 'Unknown';
      const conditionDesc = point.condition?.description || 'Unknown';
      const humidity = point.main?.humidity || 0;
      const windSpeed = point.wind?.speed || 0;
      const clouds = point.clouds || 0;
      const pressure = point.main?.pressure || 0;
      const feelsLike = point.main?.feels_like || 0;

      const el = createWeatherPinElement(temp, conditionMain);

      // Respect current visibility when placing new markers
      if (!weatherVisible) el.style.display = 'none';

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([lon, lat])
        .addTo(map);

      markers.push(marker);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 40
      });

      el.addEventListener('mouseenter', () => {
        popup
          .setLngLat([lon, lat])
          .setHTML(`
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;">
              <strong style="font-size:13px;">${conditionMain}</strong><br>
              <strong>Description:</strong> ${conditionDesc}<br>
              <strong>Temperature:</strong> ${Number(temp).toFixed(1)}°C<br>
              <strong>Feels Like:</strong> ${Number(feelsLike).toFixed(1)}°C<br>
              <strong>Humidity:</strong> ${humidity}%<br>
              <strong>Wind Speed:</strong> ${Number(windSpeed).toFixed(1)} m/s<br>
              <strong>Cloud Cover:</strong> ${clouds}%<br>
              <strong>Pressure:</strong> ${pressure} hPa<br>
              <strong>Location:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}
            </div>
          `)
          .addTo(map);
      });

      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
    });
    
    console.log('✅ [WeatherMapLayer] Finished creating', markers.length, 'weather markers');
  }

  return socket;
}
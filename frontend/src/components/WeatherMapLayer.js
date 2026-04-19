import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

/* ── Custom blue weather pin element ─────────────────── */
function createWeatherPinElement(temp, conditionMain) {
  const wrapper = document.createElement('div');
  wrapper.className = 'weather-marker';
  Object.assign(wrapper.style, {
    width: '42px',
    height: '56px',
    cursor: 'pointer',
    filter: 'drop-shadow(0 3px 8px rgba(2,132,199,0.4))',
    transition: 'transform 0.2s ease'
  });

  wrapper.addEventListener('mouseenter', () => { wrapper.style.transform = 'scale(1.15)'; });
  wrapper.addEventListener('mouseleave', () => { wrapper.style.transform = 'scale(1)'; });

  const icon = conditionMain === 'Rain' ? '🌧' :
               conditionMain === 'Clouds' ? '☁️' :
               conditionMain === 'Clear' ? '☀️' :
               conditionMain === 'Drizzle' ? '🌦' :
               conditionMain === 'Thunderstorm' ? '⛈' :
               conditionMain === 'Snow' ? '❄️' :
               conditionMain === 'Mist' || conditionMain === 'Fog' ? '🌫' : '🌡';

  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="42" height="56"
         viewBox="0 0 42 56">
      <defs>
        <linearGradient id="wp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#38bdf8"/>
          <stop offset="100%" style="stop-color:#0284c7"/>
        </linearGradient>
      </defs>
      <path d="M21 2
               C12 2 5 9.5 5 19
               C5 29 21 54 21 54
               C21 54 37 29 37 19
               C37 9.5 30 2 21 2Z"
            fill="url(#wp-grad)" stroke="#0369a1" stroke-width="1.5"/>
      <circle cx="21" cy="19" r="11" fill="#ffffff" opacity="0.92"/>
    </svg>
    <div style="position:absolute;top:8px;left:0;width:100%;text-align:center;
                font-size:14px;line-height:1;pointer-events:none;">
      ${icon}
    </div>
    <div style="position:absolute;bottom:-2px;left:0;width:100%;text-align:center;
                font-size:9px;font-weight:800;color:#0284c7;
                text-shadow:0 0 3px #fff,0 0 3px #fff;pointer-events:none;">
      ${Math.round(temp)}°C
    </div>
  `;

  return wrapper;
}

export function addWeatherMapLayer(map) {
  const socket = io('https://urbaneye-jepe.onrender.com');

  socket.on('connect', () => {
    console.log('✅ Weather layer connected to backend');
  });

  const markers = [];
  let visible = true;

  /* ── Sidebar toggle listener ───────────────────────── */
  window.addEventListener('citymap:toggle', (e) => {
    if (e.detail.layer !== 'weather') return;
    visible = e.detail.visible;
    markers.forEach((m) => {
      const el = m.getElement();
      el.style.display = visible ? '' : 'none';
    });
  });

  /* ── Weather data handler ────────────────────────── */
  socket.on('weather:update', (data) => {
    if (!Array.isArray(data) || data.length === 0) return;

    // Clear existing markers
    markers.forEach((m) => m.remove());
    markers.length = 0;

    data.forEach((point) => {
      const temp = point.main?.temp || 0;
      const conditionMain = point.condition?.main || 'Unknown';
      const el = createWeatherPinElement(temp, conditionMain);

      if (!visible) el.style.display = 'none';

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([point.lon, point.lat])
        .addTo(map);

      markers.push(marker);

      /* Hover popup */
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 44
      });

      el.addEventListener('mouseenter', () => {
        popup
          .setLngLat([point.lon, point.lat])
          .setHTML(`
            <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.65;">
              <strong style="color:#0284c7;font-size:13px;">
                ${conditionMain}
              </strong><br>
              <em style="color:#6b7280">${point.condition?.description || ''}</em><br><br>
              🌡️ <strong>${Number(temp).toFixed(1)}°C</strong>
              &nbsp;(feels ${Number(point.main?.feels_like || 0).toFixed(1)}°C)<br>
              💧 Humidity: <strong>${point.main?.humidity || 0}%</strong><br>
              💨 Wind: <strong>${Number(point.wind?.speed || 0).toFixed(1)} m/s</strong><br>
              ☁️ Clouds: <strong>${point.clouds || 0}%</strong><br>
              🔷 Pressure: <strong>${point.main?.pressure || 0} hPa</strong>
            </div>
          `)
          .addTo(map);
      });

      el.addEventListener('mouseleave', () => popup.remove());
    });
  });

  return socket;
}
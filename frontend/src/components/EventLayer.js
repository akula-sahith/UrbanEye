import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

function createPinElement() {
  const size = 36;
  const wrapper = document.createElement('div');
  wrapper.className = 'event-marker';
  Object.assign(wrapper.style, {
    width:  `${size}px`,
    height: `${size + 10}px`,
    cursor: 'pointer',
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
  });

  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${size}" height="${size + 10}"
         viewBox="0 0 36 46">
      <path d="M18 2
               C10.268 2 4 8.268 4 16
               C4 24.5 18 44 18 44
               C18 44 32 24.5 32 16
               C32 8.268 25.732 2 18 2Z"
            fill="#e53935" stroke="#b71c1c" stroke-width="1"/>
      <circle cx="18" cy="16" r="7" fill="#ffffff" opacity="0.25"/>
      <circle cx="18" cy="16" r="4" fill="#ffffff"/>
    </svg>
  `;

  return wrapper;
}

export function addEventLayer(map, events) {
  const markers = [];
  let eventsVisible = true;

  window.addEventListener('citymap:toggle', (e) => {
    if (e.detail.layer !== 'events') return;
    eventsVisible = e.detail.visible;
    markers.forEach((m) => {
      const el = m.getElement();
      el.style.display = eventsVisible ? '' : 'none';
    });
  });

  function updateEventMarkers(events) {
    markers.forEach((m) => m.remove());
    markers.length = 0;

    const coordMap = {};
    events.forEach((event) => {
      const key = event.location.coordinates.join(',');
      if (!coordMap[key]) coordMap[key] = [];
      coordMap[key].push(event);
    });

    events.forEach((event) => {
      let [lng, lat] = event.location.coordinates;

      const key = event.location.coordinates.join(',');
      const group = coordMap[key];
      const index = group.indexOf(event);

      if (group.length > 1) {
        const angle = (index / group.length) * 2 * Math.PI;
        const offset = 0.0003;
        lng += Math.cos(angle) * offset;
        lat += Math.sin(angle) * offset;
      }

      const el = createPinElement();
      if (!eventsVisible) el.style.display = 'none';

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

      markers.push(marker);
    });
  }

  // 🔥 THIS WAS MISSING
  updateEventMarkers(events);
}
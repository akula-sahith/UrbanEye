import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

function createPinElement() {
  const size = 36;
  const wrapper = document.createElement('div');
  wrapper.className = 'event-marker';
  Object.assign(wrapper.style, {
    width: `${size}px`,
    height: `${size + 10}px`,
    cursor: 'pointer',
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
  });

  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${size}" height="${size + 10}"
         viewBox="0 0 36 46">

      <!-- Pin body (teardrop) -->
      <path d="M18 2
               C10.268 2 4 8.268 4 16
               C4 24.5 18 44 18 44
               C18 44 32 24.5 32 16
               C32 8.268 25.732 2 18 2Z"
            fill="#e53935"
            stroke="#b71c1c"
            stroke-width="1"/>

      <!-- Inner highlight circle -->
      <circle cx="18" cy="16" r="7" fill="#ffffff" opacity="0.25"/>

      <!-- White dot in centre -->
      <circle cx="18" cy="16" r="4" fill="#ffffff"/>

    </svg>
  `;



  return wrapper;
}

export function addEventLayer(map) {
  const socket = io('http://localhost:5000');

  socket.on('connect', () => console.log('Connected to backend socket for events'));
  socket.on('disconnect', () => console.log('Disconnected from backend socket for events'));

  const markers = [];

  socket.on('event:all',  (events) => updateEventMarkers(events));
  socket.on('event:sync', (events) => updateEventMarkers(events));

  function updateEventMarkers(events) {
    markers.forEach(marker => marker.remove());
    markers.length = 0;

    // Group events by coordinate to detect stacking
    const coordMap = {};
    events.forEach(event => {
      const key = event.location.coordinates.join(',');
      if (!coordMap[key]) coordMap[key] = [];
      coordMap[key].push(event);
    });

    events.forEach((event) => {
      const key = event.location.coordinates.join(',');
      const group = coordMap[key];
      const indexInGroup = group.indexOf(event);

      // Offset overlapping markers slightly so all are visible
      let [lng, lat] = event.location.coordinates;
      if (group.length > 1) {
        const angle = (indexInGroup / group.length) * 2 * Math.PI;
        const offset = 0.0003;
        lng += Math.cos(angle) * offset;
        lat += Math.sin(angle) * offset;
      }

      const el = createPinElement();

      // Anchor the tip of the pin (bottom-centre) to the coordinate
      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

      markers.push(marker);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 40,
      });

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([lng, lat]).setHTML(`
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6;">
            <strong style="font-size: 13px;">${event.name}</strong><br>
            <strong>Description:</strong> ${event.description || 'N/A'}<br>
            <strong>Category:</strong> ${event.category || 'N/A'}<br>
            <strong>Organiser:</strong> ${event.organiser || 'N/A'}<br>
            <strong>Location:</strong> ${event.location_name || 'N/A'}<br>
            <strong>Start:</strong> ${event.start_at ? new Date(event.start_at).toLocaleString() : 'N/A'}<br>
            <strong>End:</strong> ${event.end_at ? new Date(event.end_at).toLocaleString() : 'N/A'}<br>
            <strong>Status:</strong> ${event.status}
          </div>
        `).addTo(map);
      });

      el.addEventListener('mouseleave', () => popup.remove());
    });
  }

  return socket;
}
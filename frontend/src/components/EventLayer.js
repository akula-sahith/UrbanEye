import { io } from 'socket.io-client';
import mapboxgl from 'mapbox-gl';

export function addEventLayer(map) {
  const socket = io('http://localhost:5000');

  socket.on('connect', () => console.log('Connected to backend socket for events'));
  socket.on('disconnect', () => console.log('Disconnected from backend socket for events'));

  const markers = [];

  socket.on('event:all', (events) => updateEventMarkers(events));
  socket.on('event:sync', (events) => updateEventMarkers(events));

  function updateEventMarkers(events) {
    markers.forEach(marker => marker.remove());
    markers.length = 0;

    // ✅ Group events by coordinate string to detect stacking
    const coordMap = {};
    events.forEach(event => {
      const key = event.location.coordinates.join(',');
      if (!coordMap[key]) coordMap[key] = [];
      coordMap[key].push(event);
    });

    // ✅ Log coord groups to confirm the issue
    console.log('Coordinate groups:', coordMap);

    events.forEach((event) => {
      const key = event.location.coordinates.join(',');
      const group = coordMap[key];
      const indexInGroup = group.indexOf(event);

      // ✅ Offset overlapping markers slightly so all are visible
      let [lng, lat] = event.location.coordinates;
      if (group.length > 1) {
        const angle = (indexInGroup / group.length) * 2 * Math.PI;
        const offset = 0.0003; // ~30 metres
        lng += Math.cos(angle) * offset;
        lat += Math.sin(angle) * offset;
      }

      const el = document.createElement('div');
      el.className = 'event-marker';
      Object.assign(el.style, {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#ff0000',
        border: '2px solid #fff',
        boxShadow: '0 0 5px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        position: 'relative',
      });

      // Add the pin point
      const point = document.createElement('div');
      Object.assign(point.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '15px solid #ff0000',
        left: '0px',
        top: '15px',
      });
      el.appendChild(point);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map);

      markers.push(marker);

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([lng, lat]).setHTML(`
          <div style="font-family: Arial, sans-serif; font-size: 12px;">
            <strong>${event.name}</strong><br>
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
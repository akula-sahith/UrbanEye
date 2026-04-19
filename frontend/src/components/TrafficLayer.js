import mapboxgl from 'mapbox-gl';

export function addTrafficLayer(map) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.addSource('traffic', {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-traffic-v1'
  });

  /* ── Sidebar toggle listener ───────────────────────── */
  window.addEventListener('citymap:toggle', (e) => {
    if (e.detail.layer !== 'traffic') return;
    const vis = e.detail.visible ? 'visible' : 'none';
    ['traffic-low','traffic-moderate','traffic-heavy','traffic-severe','traffic-closed'].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    });
  });

  const trafficLayers = [
    { id: 'traffic-low', filter: ['==', 'congestion', 'low'], color: '#00ff00' },
    { id: 'traffic-moderate', filter: ['==', 'congestion', 'moderate'], color: '#ffff00' },
    { id: 'traffic-heavy', filter: ['==', 'congestion', 'heavy'], color: '#ff8000' },
    { id: 'traffic-severe', filter: ['==', 'congestion', 'severe'], color: '#ff0000' },
    { id: 'traffic-closed', filter: ['==', 'closed', 'yes'], color: '#000000', dash: [2, 2] }
  ];

  const layerIds = trafficLayers.map(layer => layer.id);

  trafficLayers.forEach(layer => {
    map.addLayer({
      id: layer.id,
      type: 'line',
      source: 'traffic',
      'source-layer': 'traffic',
      filter: layer.filter,
      paint: {
        'line-color': layer.color,
        'line-width': layer.id === 'traffic-closed' ? 5 : 4,
        'line-opacity': 0.8,
        ...(layer.dash && { 'line-dasharray': layer.dash })
      }
    });
  });

  // Single event handler for all traffic layers
  map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
    if (features.length > 0) {
      const feature = features[0];
      const congestion = feature.properties.congestion || 'closed';
      const html = `
        <div style="font-family: Arial, sans-serif; font-size: 12px;">
          <strong>Congestion:</strong> ${congestion}
        </div>
      `;
      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    } else {
      popup.remove();
      map.getCanvas().style.cursor = '';
    }
  });

  map.on('mouseleave', () => {
    popup.remove();
    map.getCanvas().style.cursor = '';
  });
}
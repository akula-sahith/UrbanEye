export function addTrafficLayer(map) {
  map.addSource('traffic', {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-traffic-v1'
  });

  map.addLayer({
    id: 'traffic-low',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    filter: ['==', 'congestion', 'low'],
    paint: {
      'line-color': '#00ff00',
      'line-width': 2,
      'line-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'traffic-moderate',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    filter: ['==', 'congestion', 'moderate'],
    paint: {
      'line-color': '#ffff00',
      'line-width': 2,
      'line-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'traffic-heavy',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    filter: ['==', 'congestion', 'heavy'],
    paint: {
      'line-color': '#ff8000',
      'line-width': 2,
      'line-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'traffic-severe',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    filter: ['==', 'congestion', 'severe'],
    paint: {
      'line-color': '#ff0000',
      'line-width': 2,
      'line-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'traffic-closed',
    type: 'line',
    source: 'traffic',
    'source-layer': 'traffic',
    filter: ['==', 'closed', 'yes'],
    paint: {
      'line-color': '#000000',
      'line-width': 3,
      'line-dasharray': [2, 2]
    }
  });
}
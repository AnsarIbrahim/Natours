/* eslint-disable */
// Select the map container
const mapContainer = document.getElementById('map');

// Parse the locations data
const locations = JSON.parse(mapContainer.dataset.locations);

console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiYW5zYXJpYnJhaGltIiwiYSI6ImNscW0yYnlieTAxOXAyaW13ZGVma3YyNDQifQ.OqVuLYL0JOoU6TmQf3Hr2Q';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ansaribrahim/clqm3kizm00og01o90yz79iku',
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker to map
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add marker to popup
  new mapboxgl.Popup({ offset: 25 })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Add marker to bounds
  bounds.extend(loc.coordinates);
});

// Fit the map to the bounds
map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 200,
    left: 100,
    right: 100,
  },
});

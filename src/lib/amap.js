export function createCityMarkers({ AMap, map, cities, onClick } = {}) {
  if (!AMap || typeof AMap.Marker !== 'function') {
    throw new Error('AMap.Marker is not available');
  }

  if (!Array.isArray(cities)) return [];

  return cities.map((city) => {
    const marker = new AMap.Marker({
      position: [city.lng, city.lat],
      title: city.name,
      map,
      extData: city
    });

    if (typeof onClick === 'function') {
      if (typeof marker?.on !== 'function') {
        throw new Error('Marker does not support events (marker.on is missing)');
      }
      marker.on('click', () => onClick({ city, marker }));
    }

    return marker;
  });
}

export function normalizeCities(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => ({
      id: item?.id ?? null,
      name: item?.name ?? null,
      lat:
        item?.lat === null || item?.lat === undefined || item?.lat === ''
          ? Number.NaN
          : typeof item?.lat === 'number'
            ? item.lat
            : Number(item?.lat),
      lng:
        item?.lng === null || item?.lng === undefined || item?.lng === ''
          ? Number.NaN
          : typeof item?.lng === 'number'
            ? item.lng
            : Number(item?.lng)
    }))
    .filter((item) => {
      if (!item.id) return false;
      if (!item.name) return false;
      if (!Number.isFinite(item.lat)) return false;
      if (!Number.isFinite(item.lng)) return false;
      return true;
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.lat,
      lng: item.lng
    }));
}

export async function fetchCities({ fetcher = fetch } = {}) {
  const res = await fetcher('/api/cities');
  if (!res.ok) {
    throw new Error(`GET /api/cities failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('GET /api/cities returned non-array JSON');
  }

  return normalizeCities(data);
}

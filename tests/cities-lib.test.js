import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchCities, normalizeCities } from '../src/lib/cities.js';

test('normalizeCities filters invalid lat/lng and keeps required fields', () => {
  const input = [
    { id: '1', name: 'A', lat: 30, lng: 120 },
    { id: '2', name: 'B', lat: 'not-a-number', lng: 121 },
    { id: '3', name: 'C', lat: 31, lng: null },
    { id: '4', name: '', lat: 31, lng: 121 }
  ];

  const out = normalizeCities(input);

  assert.equal(out.length, 1);
  assert.deepEqual(out[0], { id: '1', name: 'A', lat: 30, lng: 120 });
});

test('fetchCities validates response is array and returns filtered cities', async () => {
  const fakeFetch = async () => {
    return {
      ok: true,
      status: 200,
      async json() {
        return [
          { id: '1', name: 'A', lat: 30, lng: 120 },
          { id: '2', name: 'B', lat: 0, lng: 'bad' }
        ];
      }
    };
  };

  const out = await fetchCities({ fetcher: fakeFetch });
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'A');
});

test('fetchCities throws on non-array response', async () => {
  const fakeFetch = async () => {
    return {
      ok: true,
      status: 200,
      async json() {
        return { not: 'array' };
      }
    };
  };

  await assert.rejects(() => fetchCities({ fetcher: fakeFetch }));
});

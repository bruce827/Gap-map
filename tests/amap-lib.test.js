import test from 'node:test';
import assert from 'node:assert/strict';

import { createCityMarkers } from '../src/lib/amap.js';

test('createCityMarkers creates one marker per city with position [lng, lat]', () => {
  const calls = [];

  const AMap = {
    Marker: class {
      constructor(opts) {
        calls.push(opts);
        this.opts = opts;
      }
    }
  };

  const map = { id: 'map' };
  const cities = [
    { id: '1', name: 'A', lat: 30, lng: 120 },
    { id: '2', name: 'B', lat: 31, lng: 121 }
  ];

  const markers = createCityMarkers({ AMap, map, cities });

  assert.equal(markers.length, 2);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].position, [120, 30]);
  assert.deepEqual(calls[1].position, [121, 31]);
  assert.equal(calls[0].title, 'A');
  assert.equal(calls[0].map, map);
  assert.deepEqual(calls[0].extData, cities[0]);
});

test('createCityMarkers throws when AMap.Marker is missing', () => {
  assert.throws(() => createCityMarkers({ AMap: {}, map: {}, cities: [] }));
});

test('createCityMarkers binds click handler when onClick is provided', () => {
  let boundEvent = null;
  let boundHandler = null;
  const clicked = [];

  const AMap = {
    Marker: class {
      constructor(opts) {
        this.opts = opts;
      }

      on(event, handler) {
        boundEvent = event;
        boundHandler = handler;
      }
    }
  };

  const map = { id: 'map' };
  const cities = [{ id: '1', name: 'A', lat: 30, lng: 120 }];

  const markers = createCityMarkers({
    AMap,
    map,
    cities,
    onClick: ({ city }) => {
      clicked.push(city.name);
    }
  });

  assert.equal(markers.length, 1);
  assert.equal(boundEvent, 'click');
  assert.equal(typeof boundHandler, 'function');

  boundHandler();
  assert.deepEqual(clicked, ['A']);
});

test('createCityMarkers throws when onClick is provided but marker.on is missing', () => {
  const AMap = {
    Marker: class {
      constructor(opts) {
        this.opts = opts;
      }
    }
  };

  assert.throws(() =>
    createCityMarkers({
      AMap,
      map: {},
      cities: [{ id: '1', name: 'A', lat: 30, lng: 120 }],
      onClick: () => {}
    })
  );
});

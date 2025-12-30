import test from 'node:test';
import assert from 'node:assert/strict';

import { getAmapScriptUrl } from '../src/lib/amap-loader.js';

test('getAmapScriptUrl does not include Weather plugin by default', () => {
  const url = getAmapScriptUrl({ amapKey: 'k' });
  assert.ok(url.includes('webapi.amap.com/maps'));
  assert.ok(url.includes('v=2.0'));
  assert.ok(url.includes('key=k'));
  assert.ok(!url.includes('AMap.Weather'));
});

test('getAmapScriptUrl includes requested plugins', () => {
  const url = getAmapScriptUrl({ amapKey: 'k', plugins: ['AMap.Geocoder'] });
  assert.ok(url.includes('plugin=AMap.Geocoder'));
});

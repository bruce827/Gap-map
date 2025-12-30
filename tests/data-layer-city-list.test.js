import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

function runSql(sql) {
  return execFileSync('sqlite3', ['data/gapmap.db', sql], {
    encoding: 'utf8',
  }).trim();
}

test('v_tangping_cities has at least 10 rows with lng/lat', () => {
  const countStr = runSql(
    "SELECT COUNT(*) FROM v_tangping_cities WHERE 经度 IS NOT NULL AND 纬度 IS NOT NULL;"
  );

  const count = Number.parseInt(countStr, 10);
  assert.ok(Number.isFinite(count), 'count should be a number');
  assert.ok(count >= 10, `expected >= 10 rows, got ${count}`);
});

test('v_tangping_cities lng/lat are parseable numbers', () => {
  const row = runSql(
    "SELECT printf('%.6f', 经度) || '|' || printf('%.6f', 纬度) FROM v_tangping_cities WHERE 经度 IS NOT NULL AND 纬度 IS NOT NULL LIMIT 1;"
  );

  const [lngStr, latStr] = row.split('|');
  assert.ok(lngStr && latStr, 'expected lng|lat output');

  const lng = Number(lngStr);
  const lat = Number(latStr);

  assert.ok(Number.isFinite(lng), 'lng should be a finite number');
  assert.ok(Number.isFinite(lat), 'lat should be a finite number');
  assert.ok(lat >= -90 && lat <= 90, `lat out of range: ${lat}`);
  assert.ok(lng >= -180 && lng <= 180, `lng out of range: ${lng}`);
});

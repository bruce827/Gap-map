import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function waitFor(fn, { timeoutMs = 5000, intervalMs = 100 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (Date.now() - start > timeoutMs) throw e;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

function startDevServer(port, envOverrides = {}) {
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    env: { ...process.env, ...envOverrides },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = { stdout: '', stderr: '' };
  child.stdout.on('data', (d) => {
    output.stdout += d.toString('utf8');
  });
  child.stderr.on('data', (d) => {
    output.stderr += d.toString('utf8');
  });

  return { child, output };
}

test('/api/cities returns >= 10 items with name/lng/lat', async () => {
  const port = 3101;
  const { child, output } = startDevServer(port);

  try {
    await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/cities`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    }, { timeoutMs: 8000 });

    const res = await fetch(`http://127.0.0.1:${port}/api/cities`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.ok(Array.isArray(data), 'expected JSON array');
    assert.ok(data.length >= 10, `expected >= 10 cities, got ${data.length}`);

    const sample = data.slice(0, 10);
    for (const item of sample) {
      assert.ok(item.name, 'name is required');
      assert.ok(item.id, 'id is required');
      assert.ok(Number.isFinite(Number(item.lng)), 'lng should be a number');
      assert.ok(Number.isFinite(Number(item.lat)), 'lat should be a number');
      assert.ok(
        item.price === null || Number.isFinite(Number(item.price)),
        'price should be a number or null'
      );
    }
  } finally {
    child.kill('SIGTERM');
  }
});

test('/api/cities returns 500 when DB/view is missing', async () => {
  const port = 3102;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gap-map-'));
  const dbPath = path.join(tmpDir, 'missing-view.db');

  execFileSync('sqlite3', [dbPath, 'PRAGMA user_version;'], {
    encoding: 'utf8'
  });

  const { child } = startDevServer(port, {
    DATABASE_URL: `file:${dbPath}`
  });

  try {
    await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/cities`);
      if (res.status !== 500) throw new Error(`HTTP ${res.status}`);
      return true;
    }, { timeoutMs: 8000 });

    const res = await fetch(`http://127.0.0.1:${port}/api/cities`);
    assert.equal(res.status, 500);

    const body = await res.json();
    assert.ok(body && typeof body === 'object', 'expected JSON object');
    assert.ok(body.error, 'expected error message');
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

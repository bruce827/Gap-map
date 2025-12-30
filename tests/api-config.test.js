import test from 'node:test';
import assert from 'node:assert/strict';
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
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return { child };
}

test('/api/config returns amapKey/amapSecurityCode', async () => {
  const port = 3103;
  const { child } = startDevServer(port, {
    AMAP_KEY: 'test_amap_key',
    AMAP_SECURITY_CODE: 'test_amap_security_code'
  });

  try {
    await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    }, { timeoutMs: 8000 });

    const res = await fetch(`http://127.0.0.1:${port}/api/config`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.amapKey, 'test_amap_key');
    assert.equal(data.amapSecurityCode, 'test_amap_security_code');
  } finally {
    child.kill('SIGTERM');
  }
});

test('/api/config returns 500 when AMAP_KEY is missing', async () => {
  const port = 3104;
  const { child } = startDevServer(port, {
    AMAP_KEY: '',
    AMAP_SECURITY_CODE: ''
  });

  try {
    await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    }, { timeoutMs: 8000 });
  } catch {
    // ignore waitFor; we'll assert directly below
  }

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/config`);
    assert.equal(res.status, 500);

    const data = await res.json();
    assert.ok(typeof data.error === 'string');
    assert.ok(data.error.includes('AMAP_KEY'));
  } finally {
    child.kill('SIGTERM');
  }
});

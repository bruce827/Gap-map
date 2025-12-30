import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test('no dynamic weather calls exist in src (AMap.Weather / getForecast)', async () => {
  const srcDir = path.join(process.cwd(), 'src');
  const files = await listFiles(srcDir);

  const forbidden = [/AMap\.Weather\b/i, /\bgetForecast\s*\(/i];

  const offenders = [];
  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.ts') && !file.endsWith('.svelte')) continue;

    const content = await readFile(file, 'utf8');
    for (const re of forbidden) {
      if (re.test(content)) {
        offenders.push({ file, pattern: String(re) });
      }
    }
  }

  assert.deepEqual(offenders, []);
});

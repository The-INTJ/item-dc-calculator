/**
 * Dev orchestration — minimal variant that just runs `next dev` with
 * .env.emulators injected. Intended for use when Firebase emulators are
 * already running from a separate session. Used by the "next-only"
 * preview launch config.
 */

import { spawn } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

try { rmSync('.next/dev/lock', { force: true }); } catch {}

function loadEnvFile(path) {
  const out = {};
  for (const raw of readFileSync(path, 'utf-8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const emuEnv = loadEnvFile('.env.emulators');
const port = process.env.PORT || '3100';

const child = spawn('npx', ['--no-install', 'next', 'dev', '--port', port], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ...emuEnv },
});

process.on('SIGINT', () => child.kill('SIGTERM'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', (code) => process.exit(code ?? 0));

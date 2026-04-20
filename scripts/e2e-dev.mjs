/**
 * E2E dev orchestration — called by Playwright's webServer.
 *
 * Starts Firebase emulators (auth + firestore), seeds test accounts,
 * then runs `next dev` with .env.emulators loaded into the child's env
 * (Next's CLI doesn't accept --env-file — that flag is node's). One
 * process tree — when Playwright stops the webServer, emulators and
 * dev die together.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync, rmSync } from 'node:fs';
import waitOn from 'wait-on';

// Stale lock from a prior Next dev that didn't exit cleanly blocks startup.
// Safe to remove — Playwright's webServer guarantees we're the only dev on 3000.
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

const PROJECT_ID = 'playground-69cbc';
// Use tcp: resources — the Firestore emulator returns 404 on GET / so
// wait-on's default http check never succeeds.
const AUTH_TCP = 'tcp:127.0.0.1:9099';
const FIRESTORE_TCP = 'tcp:127.0.0.1:8080';

let emulators;
let devServer;

function cleanup(code = 0) {
  if (devServer && !devServer.killed) devServer.kill('SIGTERM');
  if (emulators && !emulators.killed) emulators.kill('SIGTERM');
  process.exit(code);
}

process.on('SIGINT', () => cleanup(130));
process.on('SIGTERM', () => cleanup(143));
process.on('uncaughtException', (err) => {
  console.error('[e2e-dev] uncaught:', err);
  cleanup(1);
});

function spawnChild(cmd, args, env) {
  return spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: env ? { ...process.env, ...env } : process.env,
  });
}

try {
  console.log('[e2e-dev] Starting Firebase emulators...');
  emulators = spawnChild('npx', [
    '--no-install',
    'firebase',
    'emulators:start',
    '--project',
    PROJECT_ID,
    '--only',
    'auth,firestore',
  ]);
  emulators.on('exit', (code) => {
    console.error(`[e2e-dev] Emulators exited (code ${code}) before dev ready`);
    cleanup(code ?? 1);
  });

  console.log('[e2e-dev] Waiting for emulator endpoints...');
  await waitOn({
    resources: [AUTH_TCP, FIRESTORE_TCP],
    timeout: 60_000,
    interval: 250,
  });

  console.log('[e2e-dev] Seeding test accounts...');
  const seed = spawnChild('node', ['scripts/seed-emulator.mjs']);
  const [seedCode] = await once(seed, 'exit');
  if (seedCode !== 0) {
    console.error(`[e2e-dev] Seed failed (code ${seedCode})`);
    cleanup(seedCode ?? 1);
  }

  console.log('[e2e-dev] Starting Next dev server on port 3000...');
  const emuEnv = loadEnvFile('.env.emulators');
  devServer = spawnChild('npx', ['--no-install', 'next', 'dev'], emuEnv);
  devServer.on('exit', (code) => {
    console.log(`[e2e-dev] Next dev exited (code ${code})`);
    cleanup(code ?? 0);
  });

  await new Promise(() => {});
} catch (err) {
  console.error('[e2e-dev] fatal:', err);
  cleanup(1);
}

/**
 * Dev orchestration — invoked by `npm run dev` and Playwright's webServer.
 *
 * Starts Firebase emulators (auth + firestore), seeds test accounts,
 * then runs `next dev` with .env.emulators loaded into the child's env
 * (Next's CLI doesn't accept --env-file — that flag is node's). One
 * process tree — Ctrl+C (or Playwright stopping the webServer) tears
 * emulators and dev down together.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import waitOn from 'wait-on';

// Stale lock from a prior Next dev that didn't exit cleanly blocks startup.
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

// When set (e.g. by `npm run dev`), Firestore + Auth state is imported on
// startup and exported on graceful shutdown so data survives restarts.
// Unset for Playwright so E2E runs against a fresh emulator.
const DATA_DIR = process.env.EMULATOR_DATA_DIR;

let emulators;
let devServer;

async function cleanup(code = 0) {
  if (devServer && !devServer.killed) devServer.kill('SIGTERM');
  if (emulators && !emulators.killed) {
    emulators.kill('SIGTERM');
    // Give Firebase time to flush --export-on-exit before the parent dies.
    await Promise.race([
      once(emulators, 'exit'),
      new Promise((r) => setTimeout(r, 8000)),
    ]);
  }
  process.exit(code);
}

process.on('SIGINT', () => { cleanup(130); });
process.on('SIGTERM', () => { cleanup(143); });
process.on('uncaughtException', (err) => {
  console.error('[dev] uncaught:', err);
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
  console.log('[dev] Starting Firebase emulators...');
  const emulatorFlags = [
    '--no-install',
    'firebase',
    'emulators:start',
    '--project',
    PROJECT_ID,
    '--only',
    'auth,firestore',
  ];
  if (DATA_DIR) {
    emulatorFlags.push(`--export-on-exit=${DATA_DIR}`);
    if (existsSync(DATA_DIR)) {
      emulatorFlags.push(`--import=${DATA_DIR}`);
      console.log(`[dev] Importing emulator data from ${DATA_DIR}`);
    } else {
      console.log(`[dev] No existing data at ${DATA_DIR} — will export on exit`);
    }
  }
  emulators = spawnChild('npx', emulatorFlags);
  emulators.on('exit', (code) => {
    console.error(`[dev] Emulators exited (code ${code}) before dev ready`);
    cleanup(code ?? 1);
  });

  console.log('[dev] Waiting for emulator endpoints...');
  await waitOn({
    resources: [AUTH_TCP, FIRESTORE_TCP],
    timeout: 60_000,
    interval: 250,
  });

  console.log('[dev] Seeding test accounts...');
  const seed = spawnChild('node', ['scripts/seed-emulator.mjs']);
  const [seedCode] = await once(seed, 'exit');
  if (seedCode !== 0) {
    console.error(`[dev] Seed failed (code ${seedCode})`);
    cleanup(seedCode ?? 1);
  }

  console.log('[dev] Starting Next dev server on port 3000...');
  const emuEnv = loadEnvFile('.env.emulators');
  devServer = spawnChild('npx', ['--no-install', 'next', 'dev'], emuEnv);
  devServer.on('exit', (code) => {
    console.log(`[dev] Next dev exited (code ${code})`);
    cleanup(code ?? 0);
  });

  await new Promise(() => {});
} catch (err) {
  console.error('[dev] fatal:', err);
  cleanup(1);
}

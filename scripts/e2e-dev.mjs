/**
 * E2E dev orchestration — called by Playwright's webServer.
 *
 * Starts Firebase emulators (auth + firestore), seeds test accounts,
 * then runs `next dev --env-file .env.emulators`. One process tree —
 * when Playwright stops the webServer, emulators and dev die together.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import waitOn from 'wait-on';

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

function spawnChild(cmd, args) {
  return spawn(cmd, args, { stdio: 'inherit', shell: true });
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
  devServer = spawnChild('npx', [
    '--no-install',
    'next',
    'dev',
    '--env-file',
    '.env.emulators',
  ]);
  devServer.on('exit', (code) => {
    console.log(`[e2e-dev] Next dev exited (code ${code})`);
    cleanup(code ?? 0);
  });

  await new Promise(() => {});
} catch (err) {
  console.error('[e2e-dev] fatal:', err);
  cleanup(1);
}

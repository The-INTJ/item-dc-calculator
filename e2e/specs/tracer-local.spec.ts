/**
 * Tracer on one device: "Play both sides" runs entirely in the browser — no
 * sign-in, no API route, no Firestore — and the game survives a reload.
 * Starts signed out, which is exactly how a fresh playtester arrives.
 */

import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/auth';
import { chart, square, startLocalGameInLobby, submitTurn, tap } from '../fixtures/tracer';

/**
 * Collect requests that reach a server: API routes, the Firestore/Auth
 * emulators, or Google's endpoints — not the app's own JavaScript, which
 * happens to bundle the Firebase SDK.
 */
function watchServerCalls(page: Page): string[] {
  const calls: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    const isServerCall =
      url.pathname.startsWith('/api/') ||
      url.port === '8080' ||
      url.port === '9099' ||
      url.hostname.endsWith('googleapis.com');
    if (isServerCall) calls.push(request.url());
  });
  return calls;
}

test('a signed-in player’s local game stays off the network too', async ({ voter1Page: page }) => {
  const url = await startLocalGameInLobby(page);
  const serverCalls = watchServerCalls(page);
  await page.goto(url);
  await tap(page, 'e2', 'e3');
  await submitTurn(page);
  await expect(page.getByText('Black to move.')).toBeVisible();
  expect(serverCalls).toEqual([]);
});

test('both sides on one device without any server calls', async ({ page }) => {
  const serverCalls = watchServerCalls(page);
  await startLocalGameInLobby(page);
  const firstSquare = page.getByRole('group', { name: 'Tracer board' }).getByRole('button').first();
  await expect(firstSquare).toHaveAccessibleName(/^a8,/);
  await expect(page.getByText('White to move.')).toBeVisible();

  // White's 5-step Tracer charts g1 → h2 → h3: a clean path, so a rider.
  await chart(page, 'g1', ['h2', 'h3']);
  await expect(page.getByText(/Tracer charts a rider g1 → h3/)).toBeVisible();
  await submitTurn(page);

  // Black to move: the board turns to face Black.
  await expect(firstSquare).toHaveAccessibleName(/^h1,/);
  await expect(square(page, 'h3')).toHaveAccessibleName(/White 5-step Tracer, rider/);

  // A lone quiet king step is a whole king turn.
  await tap(page, 'e8', 'f8');
  await expect(page.getByText(/King steps to f8\. Submit that as your turn/)).toBeVisible();
  await submitTurn(page);
  await expect(square(page, 'f8')).toHaveAccessibleName(/Black King/);

  // Saved in this browser: a reload brings the game back.
  await page.reload();
  await expect(square(page, 'f8')).toHaveAccessibleName(/Black King/);

  // Undo takes the king step back.
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('menuitem', { name: 'Undo last move' }).click();
  await expect(square(page, 'e8')).toHaveAccessibleName(/Black King/);
  await expect(page.getByText('Black to move.')).toBeVisible();

  expect(serverCalls).toEqual([]);
});

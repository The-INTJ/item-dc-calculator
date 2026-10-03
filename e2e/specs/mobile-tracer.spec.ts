/**
 * Tracer on a phone (Pixel 7): no sideways scrolling, board squares big
 * enough to tap, and the turn controls reachable once a piece is chosen.
 * Starts signed out, so it also covers creating a game as a brand-new guest.
 */

import { test, expect } from '@playwright/test';

import { createGameInLobby, tap } from '../fixtures/tracer';

test('a phone can start and play a game comfortably', async ({ page }) => {
  await createGameInLobby(page, { name: 'Phone', hotseat: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const squareBox = await page.getByRole('button', { name: /^e4, / }).boundingBox();
  expect(squareBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(squareBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await tap(page, 'd2');
  const submit = page.getByRole('button', { name: 'Submit turn' });
  await expect(submit).toBeInViewport();
  await tap(page, 'd3');
  await expect(submit).toBeEnabled();
});

/**
 * Routes (v3), played on one device: a Tracer traces a route and stays put,
 * the route then works only as traced; a Tracer steps a square; the king
 * declares a borrowed route on one turn and moves by it on a later one.
 */

import { test, expect } from '../fixtures/auth';
import { square, startLocalGameInLobby, submitTurn, tap } from '../fixtures/tracer';

test('Routes (v3): trace and stay, step, declare then use', async ({ page }) => {
  await startLocalGameInLobby(page, 'Routes (v3)');
  await expect(page.getByRole('button', { name: 'Rules: Routes (v3)' })).toBeVisible();
  // The Wall layout: Wardens b2 through g2.
  await expect(square(page, 'c2')).toHaveAccessibleName(/White Warden/);
  await expect(square(page, 'f2')).toHaveAccessibleName(/White Warden/);

  // White's 8-step Tracer traces d1 → c2 → c3 → c4 (over its Warden: a jumper) and stays on d1.
  await tap(page, 'd1', 'c2', 'c3', 'c4');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/Where does the Tracer stop/)).toBeVisible();
  await tap(page, 'd1');
  await expect(page.getByText(/Tracer on d1 traces a jumper and stays/)).toBeVisible();
  await submitTurn(page);
  await expect(square(page, 'd1')).toHaveAccessibleName(/White 8-step Tracer, jumper/);

  // Black's unformed Tracer steps one square.
  await tap(page, 'b8');
  await page.getByRole('radio', { name: 'Move' }).click();
  await tap(page, 'a7');
  await submitTurn(page);
  await expect(square(page, 'a7')).toHaveAccessibleName(/Black 3-step Tracer/);

  // White's king declares the d1 Tracer's route: its whole turn.
  await tap(page, 'e1');
  await page.getByRole('button', { name: /Jumper · 1 × 3 · d1 Tracer/ }).click();
  await expect(page.getByText(/King declares a jumper route/)).toBeVisible();
  await submitTurn(page);

  await tap(page, 'e7', 'e6');
  await submitTurn(page);

  // From its next turn the king moves by the declared route, exactly as traced: e1 → d4.
  await tap(page, 'e1', 'd4');
  await expect(page.getByText(/King e1 → d4/)).toBeVisible();
  await submitTurn(page);
  await expect(square(page, 'd4')).toHaveAccessibleName(/White King/);
});

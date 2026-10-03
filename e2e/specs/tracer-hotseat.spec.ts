/**
 * Tracer hotseat: one person plays both sides on one device. The board turns
 * to face whoever is to move, and the king's quiet step can stand alone as a
 * whole turn.
 */

import { test, expect } from '../fixtures/auth';
import { chart, createGameInLobby, square, submitTurn, tap } from '../fixtures/tracer';

test('one person plays both sides and the board turns to face the mover', async ({ voter5Page: page }) => {
  await createGameInLobby(page, { name: 'Solo', hotseat: true });
  const board = page.getByRole('group', { name: 'Tracer board' });
  const firstSquare = board.getByRole('button').first();
  await expect(firstSquare).toHaveAccessibleName(/^a8,/);

  // White charts f1 → g2 → g3: a clean path, so a rider.
  await chart(page, 'f1', ['g2', 'g3']);
  await expect(page.getByText(/Tracer charts a rider f1 → g3/)).toBeVisible();
  await submitTurn(page);

  // Black to move: the board now has h1 in the top-left corner.
  await expect(firstSquare).toHaveAccessibleName(/^h1,/, { timeout: 20_000 });
  await expect(square(page, 'g3')).toHaveAccessibleName(/White Tracer, rider/);

  // A lone quiet king step is a whole king turn.
  await tap(page, 'd8', 'c8');
  await expect(page.getByText(/King steps to c8\. Submit that as your turn/)).toBeVisible();
  await submitTurn(page);
  await expect(firstSquare).toHaveAccessibleName(/^a8,/, { timeout: 20_000 });
  await expect(square(page, 'c8')).toHaveAccessibleName(/Black King/);
});

/**
 * Game styles: a player picks a style, tweaks a rule, and the game plays by
 * exactly those rules; a setup link carries a setup to a friend's lobby.
 * Local games, so nothing here needs a server.
 */

import { test, expect } from '../fixtures/auth';
import { chart, pickStyle, square, startLocalGame, submitTurn } from '../fixtures/tracer';

test('a tweaked style plays by its own rules', async ({ page }) => {
  await page.goto('/tracer');
  await pickStyle(page, 'Original (v1)');
  await page.getByText('Customize rules').click();
  await page.getByLabel('King’s patterns').selectOption({ label: 'None — just its step' });
  await expect(page.getByText('Customize rules (1 changed)')).toBeVisible();
  await startLocalGame(page);

  await expect(page.getByRole('button', { name: 'Rules: Original (v1) · 1 tweak' })).toBeVisible();
  // Original's spaced layout: the king starts on d1, Tracers on b, f and h.
  await expect(square(page, 'd1')).toHaveAccessibleName(/White King/);
  // Original Tracers chart any length — four steps here, past Tiered's limit of 3 for b1.
  await chart(page, 'b1', ['c1', 'c2', 'c3', 'c4']);
  await submitTurn(page);
  await expect(square(page, 'c4')).toHaveAccessibleName(/White Tracer, rider · 4 steps/);

  // The tweak shows up in the game's own rules, and the king borrows nothing.
  await page.getByRole('button', { name: /^Rules: / }).click();
  const kingRule = page.getByRole('listitem').filter({ hasText: 'The king borrows no patterns' });
  await expect(kingRule).toContainText('changed');
  await page.getByRole('tab', { name: 'Kings' }).click();
  await expect(page.getByText(/the kings borrow no patterns/)).toBeVisible();
});

test('a setup link opens the lobby set up the same way', async ({ page }) => {
  await page.goto('/tracer?style=v1-original&king=none&dodge=0');
  await expect(page.getByLabel('Game style')).toHaveValue('v1-original');
  await expect(page.getByText('Customize rules (2 changed)')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How to play · Original (v1) (tweaked)' })).toBeVisible();
  await expect(page.getByText('The king never borrows patterns: it steps one square at a time.')).toBeVisible();
});

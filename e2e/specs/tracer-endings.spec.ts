/**
 * Tracer endings driven through the game menu and status cards: a declined
 * and an accepted draw, a rematch that brings both players to the same new
 * game with colours swapped, and resignation.
 */

import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/auth';
import { createGameInLobby, inviteLink } from '../fixtures/tracer';

async function startOnlineGame(white: Page, black: Page): Promise<void> {
  await createGameInLobby(white, { name: 'Wren', side: 'White' });
  const link = await inviteLink(white);
  await black.goto(link);
  await black.getByLabel('Your name').fill('Blake');
  await black.getByRole('button', { name: 'Join as Black' }).click();
  await expect(white.getByText('Your move.', { exact: true })).toBeVisible({ timeout: 20_000 });
}

async function menu(page: Page, item: string): Promise<void> {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

test('draws are offered, declined, accepted — then a rematch swaps colours', async ({
  voter1Page: white,
  voter2Page: black,
}) => {
  await startOnlineGame(white, black);

  await menu(white, 'Offer a draw');
  await expect(white.getByText(/You offered a draw/)).toBeVisible();
  await black.getByRole('button', { name: 'Decline' }).click();
  await expect(white.getByText(/You offered a draw/)).toHaveCount(0, { timeout: 20_000 });

  await menu(black, 'Offer a draw');
  await white.getByRole('button', { name: 'Accept draw' }).click();
  await expect(white.getByText('Drawn by agreement', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(black.getByText('Drawn by agreement', { exact: true })).toBeVisible({ timeout: 20_000 });

  const finishedGame = white.url();
  await white.getByRole('button', { name: /^Rematch/ }).click();
  await expect(white).not.toHaveURL(finishedGame, { timeout: 20_000 });
  await black.getByRole('button', { name: 'Go to the rematch' }).click();
  await expect(black).toHaveURL(white.url(), { timeout: 20_000 });
  // Colours swapped: Blake now plays White and moves first.
  await expect(black.getByText('Your move.', { exact: true })).toBeVisible({ timeout: 20_000 });
});

test('resigning ends the game for both players', async ({ voter3Page: white, voter4Page: black }) => {
  await startOnlineGame(white, black);
  await menu(black, 'Resign');
  await black.getByRole('dialog').getByRole('button', { name: 'Resign' }).click();
  await expect(white.getByText('Blake resigned — Wren wins', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(black.getByText('Blake resigned — Wren wins', { exact: true })).toBeVisible({ timeout: 20_000 });
});

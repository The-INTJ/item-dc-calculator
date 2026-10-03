/**
 * Tracer helpers. Every helper is a sequence of real user actions — taps on
 * board squares (real buttons, named by their square), form fills, and the
 * same Submit button a player presses. Nothing here touches the API or
 * Firestore directly (see the no-drift rule in e2e/README.md).
 */

import { expect, type Page } from '@playwright/test';

export const GAME_URL = /\/tracer\/[A-Za-z0-9]{20}$/;
export const LOCAL_GAME_URL = /\/tracer\/local\/local-[a-z0-9]{10}$/;

interface NewGameOptions {
  name: string;
  side?: 'White' | 'Black' | 'Random';
}

/** Create an online game from the lobby and wait for its board. Returns the game URL. */
export async function createGameInLobby(page: Page, options: NewGameOptions): Promise<string> {
  await page.goto('/tracer');
  await page.getByLabel('Your name').fill(options.name);
  await page.getByText(options.side ?? 'White', { exact: true }).click();
  await page.getByRole('button', { name: /create game/i }).click();
  await expect(page).toHaveURL(GAME_URL, { timeout: 20_000 });
  await expect(page.getByRole('group', { name: 'Tracer board' })).toBeVisible();
  return page.url();
}

/** Start a game on this device (both sides) from the lobby. Returns its URL. */
export async function startLocalGameInLobby(page: Page): Promise<string> {
  await page.goto('/tracer');
  await page.getByLabel('Play both sides on this device').check();
  await page.getByRole('button', { name: 'Start local game' }).click();
  await expect(page).toHaveURL(LOCAL_GAME_URL, { timeout: 20_000 });
  await expect(page.getByRole('group', { name: 'Tracer board' })).toBeVisible();
  return page.url();
}

export function square(page: Page, name: string) {
  return page.getByRole('button', { name: new RegExp(`^${name}, `) });
}

export async function tap(page: Page, ...squares: string[]): Promise<void> {
  for (const name of squares) {
    await square(page, name).click();
  }
}

/** Select the tracer on `from`, draw `path` square by square, and finish. */
export async function chart(page: Page, from: string, path: string[]): Promise<void> {
  await tap(page, from, ...path);
  await page.getByRole('button', { name: 'Done' }).click();
}

export async function submitTurn(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Submit turn' }).click();
}

export async function expectYourMove(page: Page): Promise<void> {
  await expect(page.getByText('Your move.', { exact: true })).toBeVisible({ timeout: 20_000 });
}

/** The link shown on the invite card, exactly as a player would copy it. */
export async function inviteLink(page: Page): Promise<string> {
  const link = page.getByLabel('Game link');
  await expect(link).toHaveValue(GAME_URL);
  return link.inputValue();
}

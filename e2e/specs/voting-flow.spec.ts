/**
 * Flagship E2E — three voters submit scores concurrently, tally aggregates
 * propagate via the 300ms-paced onSnapshot listener, and every page reflects
 * the updated displayed average.
 *
 * Everything driven through real user surfaces (clicks, sliders, submits).
 * See e2e/README.md for the no-drift rule.
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import { waitForEntryScore } from '../fixtures/waitForTally';
import type { Page, Locator } from '@playwright/test';

type VoteScores = Record<string, number>;

test('three voters complete a round concurrently — tally aggregates on every page', async ({
  adminPage,
  voter1Page,
  voter2Page,
  voter3Page,
}) => {
  const { contestId } = await createContest({
    matchups: [{ entryNames: ['Paloma', 'Margarita'], phase: 'shake' }],
  });

  const pages: Page[] = [adminPage, voter1Page, voter2Page, voter3Page];
  const url = `/contest/${contestId}`;

  await Promise.all(pages.map((p) => p.goto(url)));

  // Hydration gate — confirm the matchup's vote button is present on each page.
  for (const p of pages) {
    await expect(p.getByRole('button', { name: /^vote matchup 1:/i })).toBeVisible();
  }

  // Initial tally — no votes yet
  for (const p of pages) {
    await waitForEntryScore(p, 'Paloma', null);
    await waitForEntryScore(p, 'Margarita', null);
  }

  // Three concurrent vote submissions — real race against the Firestore transaction
  await Promise.all([
    submitVoteInUI(voter1Page, { Paloma: 8, Margarita: 6 }),
    submitVoteInUI(voter2Page, { Paloma: 9, Margarita: 5 }),
    submitVoteInUI(voter3Page, { Paloma: 7, Margarita: 7 }),
  ]);

  // Tally propagates to all four pages (admin + 3 voters) via onSnapshot pacing.
  // Paloma: round((8+9+7)/3) = 8. Margarita: round((6+5+7)/3) = 6.
  for (const p of pages) {
    await waitForEntryScore(p, 'Paloma', 8);
    await waitForEntryScore(p, 'Margarita', 6);
  }
});

async function submitVoteInUI(page: Page, scores: VoteScores): Promise<void> {
  await page.getByRole('button', { name: /^vote matchup 1:/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const entries = Object.entries(scores);
  for (const [index, [drinkName, target]] of entries.entries()) {
    const card = dialog.locator('.vote-sheet__entry-card', { hasText: drinkName });
    await expect(card).toBeVisible();
    const slider = dialog.locator('.contest-vote-slider').first().getByRole('slider');
    await setSliderValue(slider, target);

    if (index < entries.length - 1) {
      await dialog.getByRole('button', { name: /next entry/i }).click();
    }
  }

  await dialog.getByRole('button', { name: /submit scores/i }).click();
  await expect(dialog.getByText(/scores submitted/i)).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(dialog).toBeHidden();
}

async function setSliderValue(slider: Locator, target: number): Promise<void> {
  // The modal pre-fills existing votes asynchronously after opening, which can
  // reset slider state mid-interaction (finding F-026) — so adjust-and-verify
  // in a retrying block instead of firing a fixed number of key presses.
  await slider.focus();
  await expect(async () => {
    let now = Number(await slider.getAttribute('aria-valuenow'));
    let guard = 0;
    while (now !== target && guard < 25) {
      await slider.press(now < target ? 'ArrowRight' : 'ArrowLeft');
      now = Number(await slider.getAttribute('aria-valuenow'));
      guard += 1;
    }
    expect(now).toBe(target);
  }).toPass({ timeout: 15_000 });
}

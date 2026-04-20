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

  // Hydration gate — confirm the active round's Vote CTA is present on each page.
  for (const p of pages) {
    await expect(p.getByRole('button', { name: /vote this round/i }).first()).toBeVisible();
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
  await page.getByRole('button', { name: /vote this round/i }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  for (const [drinkName, target] of Object.entries(scores)) {
    const card = dialog.locator('.contest-entry-card', { hasText: drinkName });
    await expect(card).toBeVisible();
    const slider = card.getByRole('slider').first();
    await setSliderValue(slider, target);
  }

  await dialog.getByRole('button', { name: /submit scores/i }).click();
  await expect(dialog.getByText(/scores submitted/i)).toBeVisible();
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(dialog).toBeHidden();
}

async function setSliderValue(slider: Locator, target: number): Promise<void> {
  await slider.focus();
  const currentAttr = await slider.getAttribute('aria-valuenow');
  const current = currentAttr ? Number(currentAttr) : 5;
  const diff = target - current;
  const key = diff > 0 ? 'ArrowRight' : 'ArrowLeft';
  for (let i = 0; i < Math.abs(diff); i++) {
    await slider.press(key);
  }
  await expect(slider).toHaveAttribute('aria-valuenow', String(target));
}

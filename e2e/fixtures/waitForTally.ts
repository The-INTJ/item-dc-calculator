/**
 * Poll-based assertion helpers for real-time tally propagation.
 *
 * Votes flow through a 300ms-paced onSnapshot listener
 * (src/features/contest/lib/realtime/firestoreSubscription.ts). These helpers
 * use `expect.poll` so we never need `page.waitForTimeout`.
 */

import { expect, type Page } from '@playwright/test';

/**
 * Waits until the displayed score for an entry matches the expected value.
 *
 * The displayed score is `Math.round(sumScore / voteCount)` — see
 * src/features/contest/lib/domain/contestGetters.ts `getEntryScore`.
 * Pass `null` to assert the empty placeholder (em-dash).
 *
 * Works for both face-off and bracket layouts.
 */
export async function waitForEntryScore(
  page: Page,
  entryName: string,
  expected: number | null,
  { timeout = 15_000 }: { timeout?: number } = {},
): Promise<void> {
  const expectedText = expected === null ? '—' : String(expected);

  await expect
    .poll(
      async () => readEntryScore(page, entryName),
      { timeout, message: `waiting for ${entryName} score = ${expectedText}` },
    )
    .toBe(expectedText);
}

async function readEntryScore(page: Page, entryName: string): Promise<string | null> {
  const row = page
    .locator('.contest-rounds__matchup-row', { hasText: entryName })
    .locator('.contest-rounds__matchup-score')
    .first();
  if ((await row.count()) > 0) {
    const text = await row.textContent();
    return text?.trim() ?? null;
  }
  return null;
}

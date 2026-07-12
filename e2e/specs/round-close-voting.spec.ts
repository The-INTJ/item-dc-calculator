/**
 * Round-close voting states — the three voter-facing cases:
 *
 * 1. Modal open when the matchup closes → live banner appears, sliders and
 *    submit disable (no silent acceptance, no crash).
 * 2. Round closed before the voter ever voted → closed-round hint tells them
 *    they didn't vote (or voted x of y).
 * 3. Force close is a real finalization → vote buttons vanish and the round
 *    reads closed everywhere, even though matchups were still open.
 *
 * The true submit race (ballot rejected mid-flight with MATCHUP_CLOSED) is
 * covered by unit tests — deterministically forcing it E2E would need mocked
 * internals, which the no-drift rule forbids.
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import type { Page } from '@playwright/test';

async function openAdminContest(page: Page, contestName: string): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('button', { name: new RegExp(escapeRegExp(contestName), 'i') }).click();
  await expect(
    page.getByRole('main').getByRole('heading', { name: contestName, level: 2 }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Round 1\b/i }).first().click();
  // Wait for the matchup subscription to populate — round-state controls read
  // the loaded matchups (e.g. force-close's open-count), so acting before the
  // realtime data arrives would see an empty round.
  await expect(page.getByRole('group', { name: 'Matchup 1' })).toBeVisible();
}

async function chooseWinner(page: Page, matchupNumber: number, winner: string): Promise<void> {
  const select = page.getByLabel(`Winner for matchup ${matchupNumber}`);
  const option = select.locator('option', { hasText: winner });
  const value = await option.getAttribute('value');
  if (!value) throw new Error(`No winner option matching "${winner}"`);
  await select.selectOption(value);
}

async function setMatchupPhase(
  page: Page,
  matchupNumber: number,
  phase: 'Shake' | 'Scored',
): Promise<void> {
  const button = page.getByRole('button', { name: `Mark matchup ${matchupNumber} as ${phase}` });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('voter with the modal open sees the closed banner when the admin scores the matchup', async ({
  adminPage,
  voter1Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Close Banner ${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [{ entryNames: [`Alpha-${suffix}`, `Bravo-${suffix}`], phase: 'shake' }],
  });

  // Voter opens the vote modal and steps to the last entry so the primary
  // action reads "Submit scores".
  await voter1Page.goto(`/contest/${contestId}`);
  await voter1Page.getByRole('button', { name: /^vote matchup 1:/i }).click();
  const dialog = voter1Page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /next entry/i }).click();
  const submitButton = dialog.getByRole('button', { name: /submit scores/i });
  await expect(submitButton).toBeEnabled();

  // Admin closes the matchup while the modal is open.
  await openAdminContest(adminPage, contestName);
  await chooseWinner(adminPage, 1, `Alpha-${suffix}`);
  await setMatchupPhase(adminPage, 1, 'Scored');

  // The realtime phase flip reaches the open modal: banner + disabled submit.
  await expect(dialog.locator('.vote-sheet__closed-banner')).toBeVisible({ timeout: 15_000 });
  await expect(dialog.locator('.vote-sheet__closed-banner')).toContainText(/voting just closed/i);
  await expect(submitButton).toBeDisabled();
  await expect(dialog.getByRole('slider').first()).toBeDisabled();

  // The modal still closes cleanly.
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(dialog).toBeHidden();
});

test('closed-round hints reflect who actually voted', async ({
  adminPage,
  voter1Page,
  voter2Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Participation ${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [
      { entryNames: [`One-${suffix}`, `Two-${suffix}`], phase: 'shake' },
      { entryNames: [`Three-${suffix}`, `Four-${suffix}`], phase: 'shake' },
    ],
  });
  const contestUrl = `/contest/${contestId}`;

  // voter1 votes matchup 1 only; voter2 votes nothing.
  await voter1Page.goto(contestUrl);
  await voter1Page.getByRole('button', { name: /^vote matchup 1:/i }).click();
  const dialog = voter1Page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /next entry/i }).click();
  await dialog.getByRole('button', { name: /submit scores/i }).click();
  await expect(dialog.getByText(/scores submitted/i)).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /close/i }).click();

  await voter2Page.goto(contestUrl);
  await expect(voter2Page.getByRole('button', { name: /^vote matchup 1:/i })).toBeVisible();

  // Admin closes both matchups (winners resolve from scores/defaults).
  await openAdminContest(adminPage, contestName);
  await chooseWinner(adminPage, 1, `One-${suffix}`);
  await setMatchupPhase(adminPage, 1, 'Scored');
  await chooseWinner(adminPage, 2, `Three-${suffix}`);
  await setMatchupPhase(adminPage, 2, 'Scored');

  // voter1: voted 1 of 2 matchups.
  await expect(voter1Page.locator('.contest-rounds__hint--missed')).toContainText(
    /you voted in 1 of 2 matchups/i,
    { timeout: 15_000 },
  );
  await expect(voter1Page.locator('.contest-rounds__matchup-voted')).toHaveCount(1);

  // voter2: didn't vote at all.
  await expect(voter2Page.locator('.contest-rounds__hint--missed')).toContainText(
    /you didn't vote in this round/i,
    { timeout: 15_000 },
  );

  // No vote buttons remain on a closed round.
  await expect(voter1Page.getByRole('button', { name: /^vote matchup/i })).toHaveCount(0);
  await expect(voter2Page.getByRole('button', { name: /^vote matchup/i })).toHaveCount(0);
});

test('force close finalizes open matchups and removes every vote affordance', async ({
  adminPage,
  voter1Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Override Cup ${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [{ entryNames: [`Gamma-${suffix}`, `Delta-${suffix}`], phase: 'shake' }],
  });

  await voter1Page.goto(`/contest/${contestId}`);
  await expect(voter1Page.getByRole('button', { name: /^vote matchup 1:/i })).toBeVisible();

  // Admin force-closes the round while its matchup is still open — the
  // destructive-action dialog spells out the finalization before confirming.
  await openAdminContest(adminPage, contestName);
  await adminPage.getByRole('button', { name: 'Force close', exact: true }).click();
  await expect(adminPage.getByText(/ends voting for 1 open matchup/i)).toBeVisible();
  await adminPage.getByRole('button', { name: 'Force close round' }).click();

  // Server finalization flips the matchup to scored; the voter page drops the
  // vote button and shows the closed state — no contradictory UI (F-002).
  await expect(voter1Page.getByRole('button', { name: /^vote matchup/i })).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(voter1Page.locator('.contest-rounds__hint--missed')).toContainText(
    /you didn't vote in this round/i,
  );

  // Admin side: the matchup now reads Scored and the round badge is Closed.
  await expect(
    adminPage.getByRole('button', { name: 'Mark matchup 1 as Scored' }),
  ).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  await expect(adminPage.getByRole('button', { name: /round 1.*closed/i })).toBeVisible();
});

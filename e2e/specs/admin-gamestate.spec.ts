/**
 * Admin gamestate boundaries — the seams the campaign hardened:
 * - cascade contestant removal (survivor becomes a bye, kept votes intact)
 * - reseed isolation (old votes don't bleed into fresh matchups)
 * - force open / clear override reflected on the voter surface
 * - admin add-contestant form with the mid-contest warning
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import { waitForEntryScore } from '../fixtures/waitForTally';

async function openAdminContest(page: Page, contestName: string): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('button', { name: new RegExp(escapeRegExp(contestName), 'i') }).click();
  await expect(
    page.getByRole('main').getByRole('heading', { name: contestName, level: 2 }),
  ).toBeVisible();
}

async function submitDefaultBallot(page: Page, matchupNumber: number): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^vote matchup ${matchupNumber}:`, 'i') }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /next entry/i }).click();
  await dialog.getByRole('button', { name: /submit scores/i }).click();
  await expect(dialog.getByText(/scores submitted/i)).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /close/i }).click();
  await expect(dialog).toBeHidden();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('cascade removal collapses the matchup to a bye and keeps the survivor’s votes', async ({
  adminPage,
  voter1Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Cascade ${suffix}`;
  const leaver = `Leaver-${suffix}`;
  const survivor = `Survivor-${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [{ entryNames: [leaver, survivor], phase: 'shake' }],
  });

  // A voter casts a real ballot first — those votes must survive the removal.
  await voter1Page.goto(`/contest/${contestId}`);
  await submitDefaultBallot(voter1Page, 1);
  await waitForEntryScore(voter1Page, survivor, 5);

  // Admin removes the leaving contestant through the participants panel.
  await openAdminContest(adminPage, contestName);
  await adminPage.getByRole('button', { name: new RegExp(escapeRegExp(leaver), 'i') }).click();
  await adminPage.getByRole('button', { name: 'Remove contestant' }).click();
  await expect(adminPage.getByText(/recalculates winners/i)).toBeVisible();
  await adminPage.getByRole('button', { name: 'Yes, remove' }).click();

  // Voter surface: the matchup collapsed to an auto-advancing bye for the
  // survivor, whose aggregate (including this voter's ballot) is intact.
  await expect(voter1Page.getByText(/bye — auto-advances/i)).toBeVisible({ timeout: 15_000 });
  await expect(voter1Page.getByText(leaver)).toHaveCount(0);
  await waitForEntryScore(voter1Page, survivor, 5);

  // Admin surface: the contestant is gone from the participants list.
  await expect(
    adminPage.getByRole('button', { name: new RegExp(escapeRegExp(leaver), 'i') }),
  ).toHaveCount(0);
});

test('reseeding a voted round starts fresh — no tally bleed-through', async ({
  adminPage,
  voter1Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Reseed ${suffix}`;
  const alpha = `Alpha-${suffix}`;
  const bravo = `Bravo-${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [{ entryNames: [alpha, bravo], phase: 'shake' }],
  });

  await voter1Page.goto(`/contest/${contestId}`);
  await submitDefaultBallot(voter1Page, 1);
  await waitForEntryScore(voter1Page, alpha, 5);

  // Admin reseeds through the confirmation dialog. The trigger button reads
  // "Reseed round" and so does the dialog's confirm button — scope the second
  // click to the modal container (ConfirmDialog renders a plain .confirm-modal).
  await openAdminContest(adminPage, contestName);
  await adminPage.getByRole('button', { name: /Round 1\b/i }).first().click();
  await adminPage.getByRole('button', { name: 'Reseed round' }).click();
  await expect(
    adminPage.getByText(/deletes 1 existing matchup along with their recorded scores/i),
  ).toBeVisible();
  await adminPage.locator('.confirm-modal').getByRole('button', { name: 'Reseed round' }).click();

  // Fresh matchups carry no votes: the tally resets to the em-dash placeholder.
  await waitForEntryScore(voter1Page, alpha, null, { timeout: 20_000 });
  await waitForEntryScore(voter1Page, bravo, null, { timeout: 20_000 });
});

test('force open and clear override are reflected live on the voter page', async ({
  adminPage,
  voter1Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Override Flow ${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    matchups: [{ entryNames: [`Set-${suffix}`, `Idle-${suffix}`], phase: 'set' }],
  });

  await voter1Page.goto(`/contest/${contestId}`);
  // A 'set' matchup exposes no vote button and no "being set up" hint.
  await expect(voter1Page.getByRole('button', { name: /^vote matchup/i })).toHaveCount(0);
  await expect(voter1Page.getByText(/next matchup is being set up/i)).toHaveCount(0);

  await openAdminContest(adminPage, contestName);
  await adminPage.getByRole('button', { name: /Round 1\b/i }).first().click();
  await adminPage.getByRole('button', { name: 'Force open', exact: true }).click();

  // Force-open flips the round active; with nothing shaking yet the voter
  // sees the "being set up" hint (still no vote button — matchup is 'set').
  await expect(voter1Page.getByText(/next matchup is being set up/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(voter1Page.getByRole('button', { name: /^vote matchup/i })).toHaveCount(0);

  await adminPage.getByRole('button', { name: /clear override/i }).click();
  await expect(voter1Page.getByText(/next matchup is being set up/i)).toHaveCount(0, {
    timeout: 15_000,
  });
});

test('admin adds a contestant and is warned when round 1 is already seeded', async ({
  adminPage,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Late Join ${suffix}`;
  await createContest({
    name: contestName,
    matchups: [{ entryNames: [`P1-${suffix}`, `P2-${suffix}`], phase: 'set' }],
  });

  await openAdminContest(adminPage, contestName);
  await adminPage.getByRole('button', { name: 'Add contestant', exact: true }).click();
  await expect(
    adminPage.getByText(/won't appear in any matchup until you reseed/i),
  ).toBeVisible();

  await adminPage.getByLabel('New contestant display name').fill(`Latecomer-${suffix}`);
  await adminPage.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(
    adminPage.getByRole('button', { name: new RegExp(`Latecomer-${suffix}`, 'i') }),
  ).toBeVisible();
});

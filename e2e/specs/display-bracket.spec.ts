/**
 * Display (broadcast) bracket — first E2E coverage of /contest/[id]/display.
 *
 * Exercises the shape-derived bracket across an odd field (the historical
 * off-grid bug case), bye rendering, TBD future rounds, connector counts,
 * the face-off swap, and champion crowning.
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';

test('renders a 5-contestant / 3-round bracket in-grid with a bye and TBD future rounds', async ({
  voterPage,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const { contestId } = await createContest({
    name: `Odd Field ${suffix}`,
    rounds: [
      { id: 'round-1', name: 'Round 1', number: 1 },
      { id: 'round-2', name: 'Round 2', number: 2 },
      { id: 'round-3', name: 'Final', number: 3 },
    ],
    matchups: [
      { entryNames: [`A-${suffix}`, `B-${suffix}`], phase: 'shake' },
      { entryNames: [`C-${suffix}`, `D-${suffix}`], phase: 'set' },
      { entryNames: [`E-${suffix}`] }, // bye — auto-scored at seed
    ],
  });

  await voterPage.goto(`/contest/${contestId}/display`);

  // Three round columns render.
  const columns = voterPage.locator('[data-round-index]');
  await expect(columns).toHaveCount(3);

  // Round 0 holds all three matchups — including the bye card, in-grid.
  const roundZeroCards = columns.nth(0).locator('[data-matchup-key]');
  await expect(roundZeroCards).toHaveCount(3);
  const byeCard = columns.nth(0).locator('[data-bye]');
  await expect(byeCard).toHaveCount(1);
  await expect(byeCard).toContainText(/bye — auto-advances/i);
  await expect(byeCard).toContainText(`E-${suffix}`);

  // Future rounds render TBD placeholder slots at derived capacity (2, then 1).
  await expect(columns.nth(1).locator('[data-matchup-key]')).toHaveCount(2);
  await expect(columns.nth(1).locator('.contest-display__matchup--tbd')).toHaveCount(2);
  await expect(columns.nth(2).locator('[data-matchup-key]')).toHaveCount(1);

  // Connectors: round-1 slots are fed by [0,1] and [2] (single feeder from the
  // bye — no dangling phantom), the final by [0,1] → 5 paths total.
  await expect(voterPage.locator('.contest-display__connector')).toHaveCount(5);

  // The active matchup pulses; the bye never does.
  await expect(
    columns.nth(0).locator('.contest-display__matchup--active'),
  ).toHaveCount(1);
  await expect(byeCard).not.toHaveClass(/contest-display__matchup--active/);

  // No champion yet.
  await expect(voterPage.locator('.contest-display__champion')).toHaveCount(0);
});

test('swaps the active 1-matchup final for the face-off panel', async ({ voterPage }) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const { contestId } = await createContest({
    name: `Face Off ${suffix}`,
    matchups: [{ entryNames: [`Left-${suffix}`, `Right-${suffix}`], phase: 'shake' }],
  });

  await voterPage.goto(`/contest/${contestId}/display`);

  // Single-round contest with the final live: face-off replaces the bracket.
  await expect(voterPage.locator('.contest-display__face-off')).toBeVisible();
  await expect(voterPage.locator('.contest-display__fo-vs')).toHaveText('VS');
  await expect(voterPage.locator('[data-round-index]')).toHaveCount(0);
  await expect(voterPage.locator('.contest-display__face-off')).toContainText(`Left-${suffix}`);
  await expect(voterPage.locator('.contest-display__face-off')).toContainText(`Right-${suffix}`);
});

test('crowns the champion once the final is scored with a winner', async ({ voterPage }) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const { contestId } = await createContest({
    name: `Crowned ${suffix}`,
    matchups: [
      {
        entryNames: [`Winner-${suffix}`, `Runner-${suffix}`],
        winnerEntryName: `Winner-${suffix}`,
      },
    ],
  });

  await voterPage.goto(`/contest/${contestId}/display`);

  await expect(voterPage.locator('.contest-display__champion')).toBeVisible();
  await expect(voterPage.locator('.contest-display__champion-name')).toContainText(
    `Winner-${suffix}`,
  );
  await expect(voterPage.locator('.contest-display__champion-meta')).toContainText(
    `Defeated Runner-${suffix}`,
  );
  await expect(voterPage.getByText(/champion crowned/i)).toBeVisible();
  // A finished final is not a face-off.
  await expect(voterPage.locator('.contest-display__face-off')).toHaveCount(0);
});

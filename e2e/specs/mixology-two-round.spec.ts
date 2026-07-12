/**
 * Full UI tournament flow (matchup-first model):
 * - four authenticated users register as mixologists (one click — drinks are
 *   named later, per matchup)
 * - admin seeds round 1 (registration order pairs 1v2, 3v4)
 * - each contestant names their drink through the matchup entry form
 * - admin opens matchups one at a time (the voter page exposes a single
 *   "Vote this matchup" CTA for the live matchup)
 * - six users vote each matchup; contestants' own drinks auto-record max
 * - admin closes winners, seeds the final, finalists rename their drinks,
 *   six users vote the final, admin crowns the champion
 *
 * Expected tallies include the self-max auto-vote: a contestant's own drink
 * records the maximum instead of their slider input.
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import { waitForEntryScore } from '../fixtures/waitForTally';
import type { Locator, Page } from '@playwright/test';

type VoteScores = Record<string, number>;

test.setTimeout(240_000);

const MIXOLOGY_CONFIG = {
  topic: 'Mixology',
  entryLabel: 'Drink',
  entryLabelPlural: 'Drinks',
  contestantLabel: 'Mixologist',
  contestantLabelPlural: 'Mixologists',
  attributes: [
    { id: 'aroma', label: 'Aroma', min: 0, max: 10 },
    { id: 'taste', label: 'Taste', min: 0, max: 10 },
    { id: 'presentation', label: 'Presentation', min: 0, max: 10 },
    { id: 'xFactor', label: 'xFactor', min: 0, max: 10 },
    { id: 'overall', label: 'Overall', min: 0, max: 10 },
  ],
};

test('six users complete a two-round mixology bracket through the UI', async ({
  adminPage,
  voterPage,
  voter1Page,
  voter2Page,
  voter3Page,
  voter4Page,
  voter5Page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 7);
  const contestName = `E2E Mixology Bracket ${suffix}`;
  const { contestId } = await createContest({
    name: contestName,
    rounds: [
      { id: 'round-1', name: 'Round 1', number: 1 },
      { id: 'round-2', name: 'Round 2', number: 2 },
    ],
    matchups: [],
    config: MIXOLOGY_CONFIG,
  });
  const contestUrl = `/contest/${contestId}`;

  // Registration order determines seeding pairs: 1v2 and 3v4.
  const contestants = [
    { page: voter1Page, drink: 'Crimson Fizz' },
    { page: voter2Page, drink: 'Garden Highball' },
    { page: voter3Page, drink: 'Nightcap Sour' },
    { page: voter4Page, drink: 'Citrus Spritz' },
  ];
  for (const contestant of contestants) {
    await registerContestant(contestant.page, contestUrl);
  }

  await openAdminContest(adminPage, contestName);
  await selectRound(adminPage, 1);
  await adminPage.getByRole('button', { name: /^Seed round$/i }).click();
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Test Voter 1');
  await expect(adminPage.getByRole('group', { name: 'Matchup 2' })).toContainText('Test Voter 4');

  // Contestants name their drinks now that they're matched up.
  for (const contestant of contestants) {
    await nameDrink(contestant.page, contestUrl, contestant.drink);
  }
  // Entry names flow to the admin via the realtime matchup subscription.
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Crimson Fizz');
  await expect(adminPage.getByRole('group', { name: 'Matchup 2' })).toContainText('Citrus Spritz');

  const voterPages = [voter1Page, voter2Page, voter3Page, voter4Page, voterPage, voter5Page];

  // ── Matchup 1: Crimson Fizz vs Garden Highball ────────────────────────────
  await setMatchupPhase(adminPage, 1, 'Shake');
  await Promise.all(voterPages.map((page) => page.goto(contestUrl)));
  for (const page of voterPages) {
    await submitVoteInUI(page, 1, { 'Crimson Fizz': 9, 'Garden Highball': 4 });
  }
  // Crimson Fizz: 5 × 9 + owner self-max 10 = 55/6 → 9.
  // Garden Highball: 5 × 4 + owner self-max 10 = 30/6 → 5.
  await waitForEntryScore(voterPage, 'Crimson Fizz', 9, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Garden Highball', 5, { timeout: 30_000 });

  await chooseWinner(adminPage, 1, 'Crimson Fizz');
  await setMatchupPhase(adminPage, 1, 'Scored');

  // ── Matchup 2: Nightcap Sour vs Citrus Spritz ─────────────────────────────
  await setMatchupPhase(adminPage, 2, 'Shake');
  // Voters stay on the page — the realtime subscription surfaces matchup 2's
  // vote button without a reload.
  for (const page of voterPages) {
    await submitVoteInUI(page, 2, { 'Nightcap Sour': 8, 'Citrus Spritz': 3 });
  }
  // Nightcap Sour: 5 × 8 + 10 = 50/6 → 8. Citrus Spritz: 5 × 3 + 10 = 25/6 → 4.
  await waitForEntryScore(voterPage, 'Nightcap Sour', 8, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Citrus Spritz', 4, { timeout: 30_000 });

  await chooseWinner(adminPage, 2, 'Nightcap Sour');
  await setMatchupPhase(adminPage, 2, 'Scored');

  // ── Final: winners advance, rename their drinks, everyone votes ───────────
  await selectRound(adminPage, 2);
  await adminPage.getByRole('button', { name: /^Seed round$/i }).click();
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Test Voter 1');
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Test Voter 3');

  await nameDrink(voter1Page, contestUrl, 'Crimson Fizz');
  await nameDrink(voter3Page, contestUrl, 'Nightcap Sour');

  await setMatchupPhase(adminPage, 1, 'Shake');
  await Promise.all(voterPages.map((page) => page.goto(contestUrl)));
  for (const page of voterPages) {
    await expect(page.getByRole('tab', { name: /round 2 active/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await submitVoteInUI(page, 1, { 'Crimson Fizz': 10, 'Nightcap Sour': 6 });
  }
  // Crimson Fizz: 5 × 10 + 10 = 60/6 → 10. Nightcap Sour: 5 × 6 + 10 = 40/6 → 7.
  await waitForEntryScore(voterPage, 'Crimson Fizz', 10, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Nightcap Sour', 7, { timeout: 30_000 });

  await chooseWinner(adminPage, 1, 'Crimson Fizz');
  await setMatchupPhase(adminPage, 1, 'Scored');
  await expect(
    adminPage.getByRole('button', { name: /round 2.*1 matchup.*closed/i }),
  ).toBeVisible();
});

async function registerContestant(page: Page, contestUrl: string): Promise<void> {
  await page.goto(contestUrl);
  await page.getByRole('button', { name: /be a mixologist/i }).click();
  await expect(page.getByText(/you are a mixologist/i)).toBeVisible({ timeout: 20_000 });
}

/**
 * Fill in the first pending matchup-entry name form on the contest page.
 * (Each contestant has at most one un-scored matchup per round in this flow.)
 */
async function nameDrink(page: Page, contestUrl: string, drink: string): Promise<void> {
  await page.goto(contestUrl);
  const form = page.locator('.matchup-entry-form').first();
  await expect(form).toBeVisible({ timeout: 20_000 });
  await form.getByLabel(/drink name/i).fill(drink);
  await form.getByRole('button', { name: /^(submit|update)$/i }).click();
  await expect(form.getByText(/saved!/i)).toBeVisible({ timeout: 20_000 });
}

async function openAdminContest(page: Page, contestName: string): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('button', { name: new RegExp(escapeRegExp(contestName), 'i') }).click();
  await expect(
    page.getByRole('main').getByRole('heading', { name: contestName, level: 2 }),
  ).toBeVisible();
}

async function selectRound(page: Page, roundNumber: number): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`Round ${roundNumber}\\b`, 'i') }).first().click();
}

async function chooseWinner(page: Page, matchupNumber: number, winner: string): Promise<void> {
  // Option labels read "Contestant: Drink" — resolve the option containing the
  // drink name, then select by value.
  const select = page.getByLabel(`Winner for matchup ${matchupNumber}`);
  const option = select.locator('option', { hasText: winner });
  const value = await option.getAttribute('value');
  if (!value) {
    throw new Error(`No winner option matching "${winner}" for matchup ${matchupNumber}`);
  }
  await select.selectOption(value);
}

async function setMatchupPhase(page: Page, matchupNumber: number, phase: 'Shake' | 'Scored'): Promise<void> {
  const button = page.getByRole('button', { name: `Mark matchup ${matchupNumber} as ${phase}` });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

async function submitVoteInUI(
  page: Page,
  matchupNumber: number,
  scores: VoteScores,
): Promise<void> {
  // Each open matchup exposes its own vote button (aria-label "Vote matchup
  // N: A vs B"), bound to that matchup's id — it only exists while the
  // matchup is in the shake phase, so there is no stale-CTA race (F-025).
  const cta = page.getByRole('button', {
    name: new RegExp(`^vote matchup ${matchupNumber}:`, 'i'),
  });
  await expect(cta).toBeVisible({ timeout: 20_000 });
  await cta.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const entries = Object.entries(scores);
  for (const [index, [drinkName, target]] of entries.entries()) {
    const card = dialog.locator('.vote-sheet__entry-card');
    await expect(card).toContainText(drinkName);

    const sliders = dialog.locator('.contest-vote-slider__field');
    const sliderCount = await sliders.count();
    for (let i = 0; i < sliderCount; i += 1) {
      await setSliderValue(sliders.nth(i), target);
    }

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
  const input = slider.getByRole('slider');
  // A contestant's own drink is auto-max and its sliders are disabled — skip.
  if (await input.isDisabled()) {
    return;
  }
  // The modal pre-fills existing votes asynchronously after opening, which can
  // reset slider state right after a click (finding F-026) — so click-and-
  // verify in a retrying block.
  await expect(async () => {
    const min = Number(await input.getAttribute('aria-valuemin')) || 0;
    const max = Number(await input.getAttribute('aria-valuemax')) || 10;
    const box = await slider.boundingBox();
    if (!box) {
      throw new Error('Slider is not visible');
    }
    const ratio = (target - min) / (max - min);
    const x = Math.max(1, Math.min(box.width - 1, box.width * ratio));
    await slider.click({ position: { x, y: box.height / 2 } });
    await expect(input).toHaveAttribute('aria-valuenow', String(target), { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Full UI tournament flow:
 * - four authenticated users register as mixologists with entries
 * - admin seeds and opens two semifinal matchups
 * - six users vote both semifinal matchups through per-matchup buttons
 * - admin closes winners, seeds the final, and six users vote the final
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import { waitForEntryScore } from '../fixtures/waitForTally';
import type { Locator, Page } from '@playwright/test';

type VoteScores = Record<string, number>;

test.setTimeout(180_000);

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

  const contestants = [
    { page: voter1Page, entryName: 'Crimson Fizz' },
    { page: voter2Page, entryName: 'Garden Highball' },
    { page: voter3Page, entryName: 'Nightcap Sour' },
    { page: voter4Page, entryName: 'Citrus Spritz' },
  ];
  for (const contestant of contestants) {
    await registerContestant(contestant.page, contestUrl, contestant.entryName);
  }

  await openAdminContest(adminPage, contestName);
  await selectRound(adminPage, 1);
  await adminPage.getByRole('button', { name: /^Seed round$/i }).click();
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Crimson Fizz');
  await expect(adminPage.getByRole('group', { name: 'Matchup 2' })).toContainText('Citrus Spritz');
  await setMatchupPhase(adminPage, 1, 'Shake');
  await setMatchupPhase(adminPage, 2, 'Shake');

  const voterPages = [voter1Page, voter2Page, voter3Page, voter4Page, voterPage, voter5Page];
  await Promise.all(voterPages.map((page) => page.goto(contestUrl)));
  for (const page of voterPages) {
    await expect(page.getByRole('button', { name: /vote matchup 1: crimson fizz vs garden highball/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /vote matchup 2: nightcap sour vs citrus spritz/i })).toBeVisible();
  }

  for (const page of voterPages) {
    await submitVoteInUI(page, /vote matchup 1/i, { 'Crimson Fizz': 9, 'Garden Highball': 4 });
    await submitVoteInUI(page, /vote matchup 2/i, { 'Nightcap Sour': 8, 'Citrus Spritz': 3 });
  }

  await waitForEntryScore(voterPage, 'Crimson Fizz', 9, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Garden Highball', 4, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Nightcap Sour', 8, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Citrus Spritz', 3, { timeout: 30_000 });

  await refreshAdmin(adminPage, contestName);
  await selectRound(adminPage, 1);
  await chooseWinner(adminPage, 1, 'Crimson Fizz');
  await setMatchupPhase(adminPage, 1, 'Scored');
  await chooseWinner(adminPage, 2, 'Nightcap Sour');
  await setMatchupPhase(adminPage, 2, 'Scored');

  await selectRound(adminPage, 2);
  await adminPage.getByRole('button', { name: /^Seed round$/i }).click();
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Crimson Fizz');
  await expect(adminPage.getByRole('group', { name: 'Matchup 1' })).toContainText('Nightcap Sour');
  await setMatchupPhase(adminPage, 1, 'Shake');

  await Promise.all(voterPages.map((page) => page.goto(contestUrl)));
  for (const page of voterPages) {
    await expect(page.getByRole('tab', { name: /round 2 active/i })).toHaveAttribute('aria-selected', 'true');
    await submitVoteInUI(page, /vote matchup 1/i, { 'Crimson Fizz': 10, 'Nightcap Sour': 6 });
  }

  await waitForEntryScore(voterPage, 'Crimson Fizz', 10, { timeout: 30_000 });
  await waitForEntryScore(voterPage, 'Nightcap Sour', 7, { timeout: 30_000 });

  await refreshAdmin(adminPage, contestName);
  await selectRound(adminPage, 2);
  await chooseWinner(adminPage, 1, 'Crimson Fizz');
  await setMatchupPhase(adminPage, 1, 'Scored');
  await expect(adminPage.getByRole('button', { name: /round 2.*1 matchup.*closed/i })).toBeVisible();
});

async function registerContestant(page: Page, contestUrl: string, entryName: string): Promise<void> {
  await page.goto(contestUrl);
  await page.getByRole('button', { name: /be a mixologist/i }).click();
  await page.getByLabel(/drink name/i).fill(entryName);
  await page.getByRole('button', { name: /register as mixologist/i }).click();
  await expect(page.getByText(/you are a mixologist/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(entryName).first()).toBeVisible();
}

async function openAdminContest(page: Page, contestName: string): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('button', { name: new RegExp(escapeRegExp(contestName), 'i') }).click();
  await expect(page.getByRole('main').getByRole('heading', { name: contestName, level: 2 })).toBeVisible();
}

async function refreshAdmin(page: Page, contestName: string): Promise<void> {
  await page.getByRole('button', { name: /refresh data/i }).click();
  await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(contestName), 'i') })).toContainText('4 entries');
}

async function selectRound(page: Page, roundNumber: number): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`Round ${roundNumber}\\b`, 'i') }).first().click();
}

async function chooseWinner(page: Page, matchupNumber: number, winner: string): Promise<void> {
  await page.getByLabel(`Winner for matchup ${matchupNumber}`).selectOption({ label: winner });
}

async function setMatchupPhase(page: Page, matchupNumber: number, phase: 'Shake' | 'Scored'): Promise<void> {
  const button = page.getByRole('button', { name: `Mark matchup ${matchupNumber} as ${phase}` });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

async function submitVoteInUI(page: Page, voteButtonName: RegExp, scores: VoteScores): Promise<void> {
  await page.getByRole('button', { name: voteButtonName }).click();

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
  const min = Number(await input.getAttribute('aria-valuemin')) || 0;
  const max = Number(await input.getAttribute('aria-valuemax')) || 10;
  const box = await slider.boundingBox();
  if (!box) {
    throw new Error('Slider is not visible');
  }

  const ratio = (target - min) / (max - min);
  const x = Math.max(1, Math.min(box.width - 1, box.width * ratio));
  await slider.click({ position: { x, y: box.height / 2 } });
  await expect(input).toHaveAttribute('aria-valuenow', String(target));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

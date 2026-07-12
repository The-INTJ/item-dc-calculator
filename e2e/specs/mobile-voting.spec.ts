/**
 * Mobile (Pixel 7) voting path — the phone-first surface is the contest
 * detail page + fullscreen vote modal. Guards:
 * - no horizontal body overflow on the core pages
 * - the vote modal opens fullscreen below MUI's `sm` breakpoint
 * - sliders remain operable and a ballot submits
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test('contest page and fullscreen vote modal work on a phone', async ({ voter1Page }) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const { contestId } = await createContest({
    name: `Mobile Cup ${suffix}`,
    matchups: [{ entryNames: [`Fizz-${suffix}`, `Sour-${suffix}`], phase: 'shake' }],
  });

  await voter1Page.goto(`/contest/${contestId}`);
  await expect(voter1Page.getByRole('button', { name: /^vote matchup 1:/i })).toBeVisible();
  await expectNoHorizontalOverflow(voter1Page);

  await voter1Page.getByRole('button', { name: /^vote matchup 1:/i }).click();
  const dialog = voter1Page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Fullscreen dialog: the paper spans the whole viewport width.
  const { paperWidth, viewportWidth } = await voter1Page.evaluate(() => {
    const paper = document.querySelector('.vote-sheet__paper');
    return {
      paperWidth: paper ? Math.round(paper.getBoundingClientRect().width) : 0,
      viewportWidth: window.innerWidth,
    };
  });
  expect(paperWidth).toBe(viewportWidth);

  // Adjust the first slider by keyboard and submit the ballot.
  const slider = dialog.getByRole('slider').first();
  await slider.focus();
  await slider.press('ArrowRight');
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '7');

  await dialog.getByRole('button', { name: /next entry/i }).click();
  await dialog.getByRole('button', { name: /submit scores/i }).click();
  await expect(dialog.getByText(/scores submitted/i)).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /close/i }).click();

  await expect(voter1Page.locator('.contest-rounds__matchup-voted')).toBeVisible();
});

test('onboard and account pages fit the phone viewport', async ({ page }) => {
  await page.goto('/onboard');
  await expect(page.getByRole('button', { name: /continue anonymously/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /account & session/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

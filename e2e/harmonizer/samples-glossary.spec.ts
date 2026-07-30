import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/harmonizer');
  // The heading no longer names the reading — the current-chords card's chip
  // is where the default fixture's reading shows up.
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
});

test('fixture demos load from the Samples menu (engine-first everywhere else)', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Samples' }).click();
  await page.getByRole('menuitem', { name: /Rising melody — build/ }).click();
  // Fixture D's first reading lands on the workbench, so its name reads as a
  // chip on the Current-chords card; its authored siblings keep their own
  // card titles. (Provenance badges are a dev view — the titles are the
  // user-visible signal that the authored set loaded.)
  const currentCard = page.getByRole('article', { name: 'Current chords' });
  await expect(currentCard.getByText('Toward the dominant', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Predominant lean' })).toBeVisible();
});

test('glossary toggletips open on term click and close on Escape', async ({ page }) => {
  // The part label is a chip-variant term trigger.
  const trigger = page.getByRole('button', { name: 'Soprano', exact: true }).first();
  await trigger.click();
  // The pinned panel shows the beginner definition (real prose, not a title=).
  await expect(page.getByText(/The highest of the four parts/).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText(/The highest of the four parts/)).toHaveCount(0);
});

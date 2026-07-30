import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/harmonizer');
  await expect(page.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeVisible();
});

test('fixture demos load from the Samples menu (engine-first everywhere else)', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Samples' }).click();
  await page.getByRole('menuitem', { name: /Rising melody — build/ }).click();
  await expect(page.getByRole('heading', { level: 3, name: 'Toward the dominant' })).toBeVisible();
  await expect(page.getByText('Authored').first()).toBeVisible();
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

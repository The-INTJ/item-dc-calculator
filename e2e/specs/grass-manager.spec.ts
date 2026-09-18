import { expect, test } from '@playwright/test';

test.describe('Grass Manager', () => {
  test('selects a yard zone and records a care action', async ({ page }) => {
    await page.goto('/grass-manager');

    await expect(page.getByRole('heading', { name: 'Make the good grass contagious.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Click a zone to make the plan local' })).toBeVisible();

    await page.locator('button[data-segment-id="right-side-hill"]').click();
    await expect(page.getByRole('heading', { name: 'Right side hill needs a small, repeatable plan.' })).toBeVisible();
    await expect(page.getByText('Gentle slope', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Log watered' }).click();
    await expect(page.getByText('1 logged care step')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Watered entry' })).toBeVisible();
  });
});

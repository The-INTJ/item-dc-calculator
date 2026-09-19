import { expect, test } from '@playwright/test';

test.describe('Grass Manager', () => {
  test('saves a profile, shows live five-day weather, and keeps the yard compact', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/grass-manager');
    await page.getByRole('textbox', { name: 'Town or ZIP code' }).fill('New York');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('button', { name: 'New York New York, United States', exact: true }).click();
    await page.getByRole('combobox', { name: 'Grass type', exact: true }).selectOption('tall-fescue');
    await page.getByRole('textbox', { name: 'Weeds · comma separated' }).fill('dandelion, crabgrass, nutsedge');
    await page.getByRole('combobox', { name: 'How much?' }).selectOption('patches');
    await page.getByRole('button', { name: 'Save lawn profile' }).click();
    await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Lawn profile' })).toHaveCount(0);
    await expect(page.getByText('New York, New York, United States', { exact: true })).toBeVisible();
    const forecast = page.getByRole('group', { name: 'Five day forecast and watering outlook' });
    await expect(forecast.getByRole('button')).toHaveCount(5, { timeout: 30_000 });
    await forecast.getByRole('button').nth(1).click();
    await expect(forecast.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: /^If the forecast holds/ })).toBeVisible();
    await expect(page.getByRole('region', { name: /details$/ })).toHaveCount(0);
    const yard = await page.getByRole('region', { name: 'Your yard', exact: true }).boundingBox();
    const weather = await page.getByRole('region', { name: 'Watering outlook', exact: true }).boundingBox();
    const lawn = await page.getByRole('region', { name: 'Your lawn', exact: true }).boundingBox();
    expect(yard!.height).toBeLessThan(260);
    expect(yard!.y + yard!.height).toBeLessThan(1000);
    expect(Math.abs(weather!.y - lawn!.y)).toBeLessThan(2);
    expect(yard!.width).toBeGreaterThan(weather!.width + 100);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Lawn profile' })).toHaveCount(0);
  });

  test('keeps whole-yard and area-only logs separate even with an area selected', async ({ page }) => {
    await page.goto('/grass-manager');
    await page.getByRole('group', { name: 'Clickable yard areas' }).getByRole('button', { name: 'Left · hill', exact: true }).click();
    const hill = page.getByRole('region', { name: 'Left side hill details', exact: true });
    await expect(hill).toBeVisible();
    const whole = page.getByRole('group', { name: 'Whole yard care', exact: true });
    await whole.getByRole('button', { name: 'Watered', exact: true }).click();
    await whole.getByRole('button', { name: 'Save for whole yard', exact: true }).click();
    await expect(whole.getByRole('status')).toHaveText('Watered saved for whole yard.');
    await expect(hill.getByText(/Last watered.*whole yard/)).toBeVisible();
    await hill.getByRole('combobox', { name: 'Sun coverage' }).selectOption('shade');
    await hill.getByRole('button', { name: 'Hand-weeded', exact: true }).click();
    await hill.getByRole('button', { name: 'Save for left side hill', exact: true }).click();
    await expect(hill.getByRole('status')).toHaveText('Hand-weeded saved for left side hill.');
    await page.getByText('Care history (2)', { exact: true }).click();
    await expect(page.getByText('Watered · Whole yard', { exact: true })).toBeVisible();
    await expect(page.getByText('Hand-weeded · Left side hill', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Left side hill details' })).toHaveCount(0);
    await page.getByRole('group', { name: 'Clickable yard areas' }).getByRole('button', { name: 'Left · hill', exact: true }).click();
    await expect(hill.getByRole('combobox', { name: 'Sun coverage' })).toHaveValue('shade');
    await page.getByRole('button', { name: 'Close area' }).click();
    await expect(hill).toHaveCount(0);
  });

  test('places the hill left, keeps trees non-interactive, and fits desktop and mobile', async ({ page }) => {
    await page.goto('/grass-manager');
    for (const size of [{ width: 3840, height: 2160 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      const areas = page.getByRole('group', { name: 'Clickable yard areas' });
      await expect(areas.getByRole('button')).toHaveCount(4);
      const left = await areas.getByRole('button', { name: 'Left · hill' }).boundingBox();
      const right = await areas.getByRole('button', { name: 'Right side' }).boundingBox();
      expect(left!.x).toBeLessThan(right!.x);
      const map = await areas.boundingBox();
      expect(map!.height).toBeLessThan(190);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
      await expect(page.getByRole('heading', { name: 'Watering outlook' })).toBeVisible();
    }
  });
});

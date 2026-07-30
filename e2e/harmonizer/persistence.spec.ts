import { expect, test } from '@playwright/test';

/**
 * Persistence v2 through the full real stack: debounced autosave →
 * localStorage → page reload → rehydration (notes verbatim, analysis
 * re-derived, engine cards regenerated).
 */
test('an edit survives a reload: notes verbatim, engine cards regenerated', async ({ page }) => {
  await page.goto('/harmonizer');
  await expect(page.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeVisible();
  // Pristine start for THIS test only (no init script — the reload later must keep storage).
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeVisible();

  // Step the first melody note down (sol → fa) through the note tools.
  await page.locator('[data-event-id="a-s-1"]').click();
  await page.getByRole('button', { name: 'Lower pitch' }).click();
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('fa');
  // Engine cards regenerate live around the edited surface.
  await expect(page.getByText('Computed').first()).toBeVisible();

  // Wait for the debounced autosave to land the EDIT (the melody's first
  // note becomes F) — the pristine melody already contains an F further in,
  // so only a structural check proves the edit was captured.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem('harmonizer.projects.v2');
          if (!raw) return 'missing';
          const parsed = JSON.parse(raw) as {
            projects?: Array<{
              workbench?: { fragment?: { events?: Array<{ pitch?: { letter?: string } }> } };
            }>;
          };
          return parsed.projects?.[0]?.workbench?.fragment?.events?.[0]?.pitch?.letter ?? 'none';
        }),
      { timeout: 10_000 },
    )
    .toBe('F');

  await page.reload();

  // The edited melody restored verbatim; fresh engine cards around it.
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('fa');
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('F4');
  await expect(page.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeVisible();
  await expect(page.getByText('Computed').first()).toBeVisible();

  // v2 housekeeping: only the v2 key exists, and analysis is stripped.
  const storage = await page.evaluate(() => ({
    v1: window.localStorage.getItem('harmonizer.projects.v1'),
    v2: window.localStorage.getItem('harmonizer.projects.v2'),
  }));
  expect(storage.v1).toBeNull();
  expect(storage.v2).not.toBeNull();
  expect(storage.v2).not.toContain('"harmonyEvents"');
});

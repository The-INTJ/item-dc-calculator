import { expect, test } from '@playwright/test';

/**
 * Persistence v2 through the full real stack: debounced autosave →
 * localStorage → page reload → rehydration (notes verbatim, analysis
 * re-derived, engine cards regenerated).
 */
test('an edit survives a reload: notes verbatim, engine cards regenerated', async ({ page }) => {
  await page.goto('/harmonizer');
  // The heading no longer names the reading — the current-chords card's chip
  // carries it.
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
  // Pristine start for THIS test only (no init script — the reload later must keep storage).
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByText('Grounded descent').first()).toBeVisible();

  // Step the first melody note down (sol → fa) through the note tools.
  await page.locator('[data-event-id="a-s-1"]').click();
  await page.getByRole('button', { name: 'Lower pitch' }).click();
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('fa');
  // Engine cards regenerate live around the edited surface: the authored set
  // is gone. (Provenance badges are a dev view, so absence is the signal.)
  await expect(page.getByRole('heading', { level: 3, name: 'Strong arrival' })).toHaveCount(0);

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

  // The edited melody restored verbatim; fresh engine cards around it (the
  // authored set stays gone — the melody no longer matches any fixture).
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('fa');
  await expect(page.locator('[data-event-id="a-s-1"]')).toContainText('F4');
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Strong arrival' })).toHaveCount(0);

  // v2 housekeeping: only the v2 key exists, and analysis is stripped.
  const storage = await page.evaluate(() => ({
    v1: window.localStorage.getItem('harmonizer.projects.v1'),
    v2: window.localStorage.getItem('harmonizer.projects.v2'),
  }));
  expect(storage.v1).toBeNull();
  expect(storage.v2).not.toBeNull();
  expect(storage.v2).not.toContain('"harmonyEvents"');
});

test('the selected measure survives a reload', async ({ page }) => {
  await page.goto('/harmonizer');
  await expect(page.getByText('Grounded descent').first()).toBeVisible();

  // Build a two-measure hymn and go back to measure 1 — all through clicks.
  await page.getByRole('button', { name: 'Current hymn' }).click();
  await page.getByRole('button', { name: 'Add measure' }).click();
  await page.getByRole('button', { name: /1\. I held/ }).click();

  // The debounced autosave lands the selection pointing at measure 1.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const raw = window.localStorage.getItem('harmonizer.projects.v2');
          if (!raw) return 'missing';
          const parsed = JSON.parse(raw) as {
            projects?: Array<{
              workbench?: {
                appliedFragments?: Array<{ id?: string }>;
                selectedMeasureId?: string;
              };
            }>;
          };
          const workbench = parsed.projects?.[0]?.workbench;
          if (workbench?.appliedFragments?.length !== 2) return 'not-two-measures';
          return workbench.selectedMeasureId === workbench.appliedFragments[0]?.id
            ? 'first-selected'
            : 'other-selected';
        }),
      { timeout: 10_000 },
    )
    .toBe('first-selected');

  await page.reload();
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
  await page.getByRole('button', { name: 'Current hymn' }).click();
  // span[data-selected] is the rail pill (the selected suggestion card is an
  // article with the same attribute).
  const selected = page.locator('span[data-selected]');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText('1.');
});

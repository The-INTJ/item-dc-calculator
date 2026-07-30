import { expect, test } from '@playwright/test';

/**
 * The all-keys flow, driven exactly as a user drives it: real select, real
 * clicks (the no-drift rule — no test endpoints, no store pokes).
 */
test.describe('key change', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/harmonizer');
    // The heading no longer names the reading — the current-chords card's
    // chip carries it.
    await expect(page.getByText('Grounded descent').first()).toBeVisible();
  });

  test('re-reads every note in the new key without moving a pitch, and undoes', async ({
    page,
  }) => {
    const firstNote = page.locator('[data-event-id="a-s-1"]');
    await expect(firstNote).toContainText('sol');
    await expect(firstNote).toContainText('G4');

    // Pick E♭ major from the real Key select (24 options, two optgroups).
    const keySelect = page.getByLabel('Key');
    await keySelect.selectOption({ label: 'E♭ major' });

    // The pitch held; the reading re-spoke: G4 is mi in E♭ major.
    await expect(firstNote).toContainText('mi');
    await expect(firstNote).toContainText('G4');
    // The melody's E natural is honestly chromatic (di), never respelled away.
    await expect(page.locator('[data-event-id="a-s-3"]')).toContainText('di');
    // The computed key-signature hint follows.
    await expect(page.getByText('3 flats · B♭ E♭ A♭')).toBeVisible();

    // One undo restores the key and every reading atomically.
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(firstNote).toContainText('sol');
    await expect(page.getByText('no sharps or flats')).toBeVisible();
  });
});

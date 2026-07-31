import { expect, test } from '@playwright/test';

const STAFF = '[data-staff-system]';
const LANES = '[data-lane-grid]';

/**
 * Pristine start WITHOUT an init script: the notation preference is stored in
 * localStorage, and an init script would clear it again on the reload one of
 * these tests performs — hiding the very thing that test checks.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/harmonizer');
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByText('Grounded descent').first()).toBeVisible();
});

test('the notation setting swaps between the lanes, the staff, and both', async ({ page }) => {
  const notation = page.getByLabel('Notation');

  // Nothing changes for anyone who never opens the setting.
  await expect(notation).toHaveValue('lanes');
  await expect(page.locator(LANES).first()).toBeVisible();
  await expect(page.locator(STAFF)).toHaveCount(0);

  // The staff replaces the lanes...
  await notation.selectOption('staff');
  await expect(page.locator(STAFF)).toBeVisible();
  await expect(page.locator(LANES)).toHaveCount(0);

  // ...and the editor around them is untouched either way.
  await expect(page.getByRole('heading', { level: 2, name: 'Current measure' })).toBeVisible();

  // Both together is the arrangement the staff was built for.
  await notation.selectOption('both');
  await expect(page.locator(STAFF)).toBeVisible();
  await expect(page.locator(LANES).first()).toBeVisible();
});

test('the chosen notation survives a reload', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('both');
  await expect(page.locator(STAFF)).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Notation')).toHaveValue('both');
  await expect(page.locator(STAFF)).toBeVisible();
  await expect(page.locator(LANES).first()).toBeVisible();
});

test('the staff draws the same notes the lanes hold, shaped by degree', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('both');

  // The default reading is sol, fa, mi over three whole notes: six noteheads,
  // and the melody's own three wear a round, a side triangle and a diamond.
  const heads = page.locator(`${STAFF} [data-shape]`);
  await expect(heads).toHaveCount(6);

  const shapes = await heads.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-shape')),
  );
  expect(shapes.slice(0, 3)).toEqual(['round', 'triangleSide', 'diamond']);

  // Whole notes are drawn open, the melody's quarters filled in.
  const bases = await heads.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-base')),
  );
  expect(bases).toContain('w');
  expect(bases).toContain('q');
});

test('an edit in the lanes shows up on the staff', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('both');

  // Raise the melody's first note through the real note tools; the staff is a
  // reading of the same data, so its shape has to follow.
  const before = await page
    .locator(`${STAFF} [data-shape]`)
    .first()
    .getAttribute('data-shape');
  expect(before).toBe('round');

  await page.locator(`${LANES} [data-event-id]`).first().click();
  await page.getByRole('button', { name: 'Raise pitch' }).first().click();

  await expect(page.locator(`${STAFF} [data-shape]`).first()).toHaveAttribute(
    'data-shape',
    'square',
  );
});

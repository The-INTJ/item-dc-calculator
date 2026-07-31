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

test('the grid moves a note by half steps, and one click is one undo', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('staff');

  const melodyHead = page.locator(`${STAFF} [data-shape]`).first();
  await expect(melodyHead).toHaveAttribute('data-shape', 'round');

  await page.locator(`${STAFF} button[data-event-id="a-s-1"]`).click();
  const chooser = page.getByRole('group', { name: 'Change this note' });
  // Seven by seven: three steps out in each direction. The X and the footer's
  // controls sit outside the cell grid, so the count comes from the grid.
  await expect(chooser.locator('[data-note-grid] button')).toHaveCount(49);

  // A half step above sol is si — a RAISED SOL. It keeps sol's round head and
  // prints a sharp rather than becoming some other degree.
  await chooser.getByRole('button', { name: '1 half step higher, same length' }).click();
  await expect(melodyHead).toHaveAttribute('data-shape', 'round');
  await expect(melodyHead).toHaveAttribute('data-accidental', '#');

  // A corner cell moves pitch and length together — four dispatches for one
  // click, and one undo takes the whole thing back.
  await chooser
    .getByRole('button', { name: '3 half steps higher, 1 sixteenth longer, written tied' })
    .click();
  await expect(page.locator(`${STAFF} [data-shape]`).first()).not.toHaveAttribute(
    'data-accidental',
    '#',
  );

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(melodyHead).toHaveAttribute('data-shape', 'round');
  await expect(melodyHead).toHaveAttribute('data-accidental', '#');
  await expect(melodyHead).toHaveAttribute('data-base', 'q');
});

test('a part with room gets a note from its own plus button', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('staff');

  const altoPlus = page.locator(`${STAFF} button[data-voice="alto"]`);
  // Every part fills the bar to start with, so no part has anywhere to put one.
  await expect(altoPlus).toBeDisabled();

  // Make room: shorten the alto's whole note. Thirteen sixteenths has no symbol
  // of its own, which the cell says in its own name.
  await page.locator(`${STAFF} button[data-event-id="a-a-1"]`).click();
  const chooser = page.getByRole('group', { name: 'Change this note' });
  await chooser
    .getByRole('button', { name: 'same pitch, 3 sixteenths shorter, written tied' })
    .click();
  await chooser.getByRole('button', { name: 'Close' }).click();
  await expect(altoPlus).toBeEnabled();

  const before = await page.locator(`${STAFF} [data-voice="alto"][data-shape]`).count();
  await altoPlus.click();

  // The note before it was far too long to copy into three sixteenths, so the
  // new note took the room — and the grid opened on it straight away.
  await expect(page.locator(`${STAFF} [data-voice="alto"][data-shape]`)).toHaveCount(before + 1);
  await expect(page.getByRole('group', { name: 'Change this note' })).toBeVisible();
  await expect(altoPlus).toBeDisabled();
});

test('a note can be silenced and heard again without losing anything', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('both');

  const heads = page.locator(`${STAFF} [data-voice="soprano"][data-shape]`);
  const laneCell = page.locator(`${LANES} [data-event-id="a-s-1"]`);
  const before = await heads.count();

  await page.locator(`${STAFF} button[data-event-id="a-s-1"]`).click();
  const chooser = page.getByRole('group', { name: 'Change this note' });
  await chooser.getByRole('button', { name: 'Rest' }).click();

  // The head leaves the staff and the lane says "rest" — one silence, both
  // views — but the note itself is still there to be switched back.
  await expect(heads).toHaveCount(before - 1);
  await expect(laneCell).toHaveAttribute('data-rest', 'true');
  await expect(chooser.getByRole('button', { name: 'Rest' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await chooser.getByRole('button', { name: 'Note' }).click();
  await expect(heads).toHaveCount(before);
  await expect(laneCell).not.toHaveAttribute('data-rest', 'true');
});

test('a deleted note leaves a rest you can click and take back', async ({ page }) => {
  await page.getByLabel('Notation').selectOption('staff');

  const heads = page.locator(`${STAFF} [data-voice="soprano"][data-shape]`);
  const sopranoPlus = page.locator(`${STAFF} button[data-voice="soprano"]`);
  const before = await heads.count();

  await page.locator(`${STAFF} button[data-event-id="a-s-1"]`).click();
  const chooser = page.getByRole('group', { name: 'Change this note' });
  await chooser.getByRole('button', { name: 'Delete this note' }).click();
  await expect(heads).toHaveCount(before - 1);

  // The notes after it closed the gap and its time went to the end as a rest —
  // so the part is still exactly a measure and no room was freed.
  await expect(sopranoPlus).toBeDisabled();

  // The rest is a real thing with a target, not a hole in the bar.
  const rest = page.locator(`${STAFF} button[data-rest][data-event-id="a-s-1"]`).first();
  await expect(rest).toBeVisible();
  await rest.click();
  await expect(chooser.getByRole('button', { name: 'Rest' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await chooser.getByRole('button', { name: 'Note' }).click();
  await expect(heads).toHaveCount(before);
});

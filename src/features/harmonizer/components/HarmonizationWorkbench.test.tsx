import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HarmonizationWorkbench } from './HarmonizationWorkbench';

vi.mock('../services/tone-playback-service', () => {
  class FakePlaybackService {
    playMelody = vi.fn(async () => {});
    playHarmony = vi.fn(async () => {});
    playSATB = vi.fn(async () => {});
    playVoice = vi.fn(async () => {});
    playVoices = vi.fn(async () => {});
    setInstrument = vi.fn();
    stop = vi.fn();
  }
  return { ToneJsPlaybackService: FakePlaybackService };
});

// Vitest runs without `globals: true`, so RTL's automatic cleanup never hooks in.
afterEach(cleanup);
// Each spec starts from a pristine store: with a saved project present, mount
// would rehydrate it (v2: engine cards regenerate around the saved reading)
// instead of showing the default fixture's authored first paint.
beforeEach(() => window.localStorage.clear());

/**
 * Provenance badges and derivability chips are a local developer view (Drew,
 * 2026-07-30) — specs that assert on where a reading came from have to ask for
 * them the same way a developer does (shared/useDevFlag.ts).
 */
function enableDevView() {
  window.localStorage.setItem('harmonizer.dev.v1', '1');
}

function getCardByTitle(title: string): HTMLElement {
  const cards = screen.getAllByRole('article');
  const card = cards.find((candidate) =>
    within(candidate).queryByRole('heading', { level: 3, name: title }),
  );
  if (!card) throw new Error(`No candidate card titled "${title}"`);
  return card;
}

/**
 * The reading that is actually on the workbench: its card is titled "Current
 * chords" and demotes the reading's name to a chip (Drew, 2026-07-30).
 */
function getCurrentCard(): HTMLElement {
  return getCardByTitle('Current chords');
}

/** The workbench heading no longer names the reading — the card's chip does. */
function expectWorkingReading(name: string) {
  expect(within(getCurrentCard()).getByText(name)).toBeTruthy();
}

/** Note cells of the first lane (soprano), in time order. */
function sopranoCells(container: HTMLElement): HTMLElement[] {
  const lane = container.querySelector('[data-lane-grid]');
  if (!lane) throw new Error('soprano lane missing');
  return [...lane.querySelectorAll('[data-event-id]')] as HTMLElement[];
}

describe('HarmonizationWorkbench', () => {
  it('renders the workspace-first layout with candidate A preview-selected', () => {
    render(<HarmonizationWorkbench />);

    // Workspace: the bare region heading with the transport in line (reading
    // names live on the cards below), four voice checkboxes; boundary pills
    // are gone.
    expect(screen.getByRole('heading', { level: 2, name: 'Current measure' })).toBeTruthy();
    expectWorkingReading('Grounded descent');
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.queryByText('hold harmony')).toBeNull();
    expect(screen.queryByText('change allowed')).toBeNull();

    // The transport is the only playback control here now — Loop and Add note
    // are gone. The gesture hints fold behind "How to use", closed by default.
    expect(screen.queryByRole('button', { name: 'Loop' })).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add note' })).toBeNull();
    expect(screen.queryByText(/Hold bars \+ drag/)).toBeNull();
    const howToUse = screen.getByRole('button', { name: 'How to use' });
    expect(howToUse.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(howToUse);
    expect(howToUse.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Hold bars \+ drag to change note lengths/)).toBeTruthy();
    expect(screen.getByText(/Click a note to change, add, or lock it/)).toBeTruthy();
    fireEvent.click(howToUse);
    expect(screen.queryByText(/Hold bars \+ drag/)).toBeNull();

    // Palette below with three cards; A selected. Each card carries an
    // explicit Select button (Drew, 2026-07-30: the card body hosts glossary
    // terms, so the whole card is no longer a click target); the selected
    // card's button reads Selected and is inert.
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(getCurrentCard().getAttribute('data-selected')).toBe('true');
    expect(screen.getAllByRole('button', { name: 'Select' })).toHaveLength(2);
    expect(
      within(getCurrentCard())
        .getByRole('button', { name: 'Selected' })
        .hasAttribute('disabled'),
    ).toBe(true);

    // The current card reports the workbench, not itself: no summary prose,
    // and the reading's name demoted to a chip under "Your work's reading:".
    const current = within(getCurrentCard());
    expect(current.getByText("Your work's reading:")).toBeTruthy();
    expect(current.getByText('Grounded descent')).toBeTruthy();
    expect(current.queryByText(/the source of truth/)).toBeNull();
  });

  it('shows engine bookkeeping only in the dev view', () => {
    const { unmount } = render(<HarmonizationWorkbench />);
    // Emotional descriptors stay; provenance and derivability do not.
    expect(screen.getAllByText('strong dominant arrival').length).toBeGreaterThan(0);
    expect(screen.queryByText('Authored')).toBeNull();
    expect(screen.queryByText(/chord path/)).toBeNull();
    unmount();

    // Back to a pristine store, or the second mount rehydrates the project the
    // first one auto-created and shows regenerated cards instead of the
    // fixture's authored first paint.
    window.localStorage.clear();
    enableDevView();
    render(<HarmonizationWorkbench />);
    // (Derivability chips ride along with computed readings — see the hero flow.)
    expect(screen.getAllByText('Authored').length).toBeGreaterThan(0);
  });

  it('offers the time-signature seat: 4/4, the only option for now', () => {
    render(<HarmonizationWorkbench />);
    const select = screen.getByRole('combobox', { name: 'Time signature' });
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe('4/4');
  });

  it('asks what the section should do, next to the readings it steers', () => {
    render(<HarmonizationWorkbench />);
    const intent = screen.getByRole('combobox', {
      name: 'What do you want this section to do?',
    });
    expect((intent as HTMLSelectElement).value).toBe('continue');
    fireEvent.change(intent, { target: { value: 'close' } });
    expect(
      (
        screen.getByRole('combobox', {
          name: 'What do you want this section to do?',
        }) as HTMLSelectElement
      ).value,
    ).toBe('close');
  });

  it('selects a reading with its Select button', () => {
    render(<HarmonizationWorkbench />);

    const cardC = getCardByTitle('Keep moving');
    fireEvent.click(within(cardC).getByRole('button', { name: 'Select' }));

    expectWorkingReading('Keep moving');
    expect(cardC.getAttribute('data-selected')).toBe('true');
    expect(getCardByTitle('Grounded descent').getAttribute('data-selected')).toBeNull();
    expect(screen.getAllByText('C/E').length).toBeGreaterThan(0);
  });

  it('note tools are live; locking regenerates honestly and freezes the note', () => {
    enableDevView();
    const { container } = render(<HarmonizationWorkbench />);

    const altoCell = container.querySelector('[data-event-id="a-a-1"]');
    if (!(altoCell instanceof HTMLElement)) throw new Error('alto note cell missing');
    expect(screen.queryByRole('toolbar')).toBeNull();

    fireEvent.click(altoCell);
    expect(screen.getByRole('toolbar')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Raise pitch' }).hasAttribute('disabled'),
    ).toBe(false);
    // A one-note part cannot lose its last note.
    expect(
      screen.getByRole('button', { name: 'Delete note' }).hasAttribute('disabled'),
    ).toBe(true);
    // Both ghosts are offered even on a lone note — they move inside it.
    expect(screen.getByRole('button', { name: 'Add note before' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add note after' })).toBeTruthy();

    // Locking whole-bar E against the melody's fa: no vocabulary chord holds
    // both — but the engine EXPLAINS the fa as passing motion over the held
    // chord instead of dead-ending. The WORKSPACE stays exactly as it is
    // (the surface rule) while computed cards appear around it.
    fireEvent.click(screen.getByRole('button', { name: 'Lock note' }));
    expectWorkingReading('Grounded descent');
    expect(altoCell.getAttribute('data-locked')).toBe('true');
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);
    expect(screen.queryByText(/E\+F/)).toBeNull(); // the math filled the old hole
    // The locked note is frozen; the cluster never closed (workspace intact).
    expect(
      screen.getByRole('button', { name: 'Raise pitch' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock note' }));
    // Engine-first: unlocking regenerates unconstrained computed cards.
    expect(altoCell.getAttribute('data-locked')).not.toBe('true');
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);

    // Escape closes the cluster; the soprano lock is a LIVE toggle like every
    // other voice — nothing defaults locked.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('toolbar')).toBeNull();
    const sopranoCell = container.querySelector('[data-event-id="a-s-1"]');
    if (!(sopranoCell instanceof HTMLElement)) throw new Error('soprano note cell missing');
    fireEvent.click(sopranoCell);
    expect(screen.queryByRole('button', { name: 'The melody is always locked' })).toBeNull();
    const sopranoLock = screen.getByRole('button', { name: 'Lock note' });
    expect(sopranoLock.hasAttribute('disabled')).toBe(false);
    fireEvent.click(sopranoLock);
    expect(sopranoCell.getAttribute('data-locked')).toBe('true');
    // A locked soprano note is frozen against editing.
    expect(
      screen.getByRole('button', { name: 'Raise pitch' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock note' }));
    expect(sopranoCell.getAttribute('data-locked')).not.toBe('true');
  });

  it('hero flow: arrows regenerate engine cards; fixture demos load from Samples', () => {
    enableDevView();
    const { container } = render(<HarmonizationWorkbench />);

    // sol ▼ → fa: the engine regenerates computed CARDS with derivability
    // chips, while the workspace keeps its own (edited) notes.
    fireEvent.click(sopranoCells(container)[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chord path/).length).toBeGreaterThan(0);
    expectWorkingReading('Grounded descent');

    // ▼ again → mi. The workspace never swapped, so the tool cluster is
    // still open on the same note — press the arrow again directly.
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));

    // Third note ▲ ▲ → sol: engine-first means even mi–fa–sol (fixture D's
    // melody) stays computed — authored demos never outrank live analysis.
    fireEvent.click(sopranoCells(container)[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);
    expect(screen.queryByText('Authored')).toBeNull();

    // The demo is one explicit click away: Samples → fixture D.
    fireEvent.keyDown(window, { key: 'Escape' }); // close the tool cluster
    fireEvent.click(screen.getByRole('button', { name: 'Samples' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Rising melody — build/ }));
    // Its first reading lands on the workbench, so its name reads as a chip on
    // the current-chords card rather than as that card's own title.
    expect(within(getCurrentCard()).getByText('Toward the dominant')).toBeTruthy();
    expect(screen.getAllByText('Authored').length).toBeGreaterThan(0);
  });

  it('expands the analysis drawer with interpretations and evidence', () => {
    render(<HarmonizationWorkbench />);

    const evidenceText = 'The harmony does not change across the fragment.';
    expect(screen.queryByText(evidenceText)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'View analysis evidence' }));
    expect(screen.getByText(evidenceText)).toBeTruthy();
    expect(screen.getAllByText('passing tone').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Hide analysis evidence' }));
    expect(screen.queryByText(evidenceText)).toBeNull();
  });

  it('plays exactly the checked parts from the master Play button', () => {
    render(<HarmonizationWorkbench />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Bass/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByText('Playing Soprano + Alto + Tenor')).toBeTruthy();

    // Both the master button and the selected card show Stop; the master is first.
    fireEvent.click(screen.getAllByRole('button', { name: 'Stop' })[0]);
    expect(screen.getByText('Playback stopped')).toBeTruthy();
  });

  it('caps the editor at one measure, refusing further growth honestly', () => {
    const { container } = render(<HarmonizationWorkbench />);
    // The default fragment fills exactly one measure; the grid never shrinks
    // below a measure or grows past it, so there is nothing to pan.
    expect(screen.queryByRole('slider')).toBeNull();

    // A ghost note that would push the part past the measure is disabled and
    // says why, instead of silently doing nothing.
    const cells = sopranoCells(container);
    fireEvent.click(cells[cells.length - 1]);
    const ghost = screen.getByRole('button', { name: 'Add note after' });
    expect(ghost.hasAttribute('disabled')).toBe(true);
    expect(ghost.getAttribute('title')).toBe('The measure is full — shorten a note first');
    fireEvent.click(ghost);
    expect(sopranoCells(container)).toHaveLength(3);
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('marks the beats with translucent dots in every voice lane', () => {
    const { container } = render(<HarmonizationWorkbench />);
    // One measure of 4/4: four dots per voice lane (the chord lane has none),
    // the downbeat one per lane.
    expect(container.querySelectorAll('[data-beat-dot]')).toHaveLength(16);
    expect(container.querySelectorAll('[data-downbeat]')).toHaveLength(4);
  });

  it('the Current hymn starts folded with Play hymn reachable; play never expands it', () => {
    render(<HarmonizationWorkbench />);
    // The working measure IS the hymn from first paint…
    expect(screen.getByRole('button', { name: /Play hymn/ })).toBeTruthy();
    // …but the fold starts closed: no pills, no Add measure.
    const toggle = screen.getByRole('button', { name: 'Current hymn' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Add measure' })).toBeNull();

    // Playing the hymn is reachable while folded and does not expand it.
    fireEvent.click(screen.getByRole('button', { name: /Play hymn/ }));
    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Add measure' })).toBeNull();

    // The toggle opens and closes the measure list.
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Add measure' })).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.queryByRole('button', { name: 'Add measure' })).toBeNull();
  });

  it('Add measure appends and selects; clicking a pill selects it in place', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: 'Current hymn' }));

    // The working measure renders as the selected pill from the start.
    const firstPill = screen.getByRole('button', { name: /1\. I held/ });
    expect(firstPill.closest('[data-selected]')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Hear this measure: 1/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Add measure' }));
    // The new measure opens on one beat per part, held on what the previous
    // measure ended with — four notes, one per lane — and its pill selects.
    expect(container.querySelectorAll('[data-event-id]')).toHaveLength(4);
    expect(sopranoCells(container)).toHaveLength(1);
    const secondPill = screen.getByRole('button', { name: /2\./ });
    expect(secondPill.closest('[data-selected]')).toBeTruthy();
    expect(screen.getByRole('button', { name: /1\. I held/ }).closest('[data-selected]')).toBeNull();

    // Clicking pill 1 selects it immediately — its reading loads, the pill
    // squares up, and there is no replace/rework language anywhere.
    fireEvent.click(screen.getByRole('button', { name: /1\. I held/ }));
    expectWorkingReading('Grounded descent');
    expect(screen.getByRole('button', { name: /1\. I held/ }).closest('[data-selected]')).toBeTruthy();
    expect(screen.queryByText(/replace this piece/)).toBeNull();

    // Add measure ALWAYS appends at the end — never replaces the selection.
    fireEvent.click(screen.getByRole('button', { name: 'Add measure' }));
    expect(screen.getByRole('button', { name: /1\. I held/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /2\./ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /3\./ }).closest('[data-selected]')).toBeTruthy();
  });

  it('the selected pill mirrors the workspace live', () => {
    render(<HarmonizationWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: 'Current hymn' }));
    expect(screen.getByRole('button', { name: /1\. I held/ })).toBeTruthy();

    // Adopting a different reading rewrites the pill immediately — no Add
    // click needed (write-through).
    const cardC = getCardByTitle('Keep moving');
    fireEvent.click(within(cardC).getByRole('button', { name: 'Select' }));
    expect(screen.queryByRole('button', { name: /1\. I held/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^1\./ })).toBeTruthy();
  });

  it('whole-hymn playback leaves the workspace cursor alone', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: /Play hymn/ }));
    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    // The hymn runs on its own timeline, so no workspace note lights up.
    expect(container.querySelector('[data-active]')).toBeNull();
    expect(screen.getByRole('button', { name: /Stop/ })).toBeTruthy();
  });

  it('audition from a card plays all voices without changing the selection', () => {
    render(<HarmonizationWorkbench />);

    const cardB = getCardByTitle('Strong arrival');
    fireEvent.click(within(cardB).getByRole('button', { name: 'Hear all four parts' }));

    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    // The play button stops propagation — the selection stays on A.
    expectWorkingReading('Grounded descent');

    fireEvent.click(within(cardB).getByRole('button', { name: 'Stop' }));
    expect(screen.getByText('Playback stopped')).toBeTruthy();
    expect(within(cardB).getByRole('button', { name: 'Hear all four parts' })).toBeTruthy();
  });
});

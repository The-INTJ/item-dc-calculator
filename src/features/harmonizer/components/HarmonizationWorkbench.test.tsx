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

/** Note cells of the first lane (soprano), in time order. */
function sopranoCells(container: HTMLElement): HTMLElement[] {
  const lane = container.querySelector('[data-lane-grid]');
  if (!lane) throw new Error('soprano lane missing');
  return [...lane.querySelectorAll('[data-event-id]')] as HTMLElement[];
}

describe('HarmonizationWorkbench', () => {
  it('renders the workspace-first layout with candidate A preview-selected', () => {
    render(<HarmonizationWorkbench />);

    // Workspace: heading, master play, four voice checkboxes; boundary pills are gone.
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.queryByText('hold harmony')).toBeNull();
    expect(screen.queryByText('change allowed')).toBeNull();

    // The transport is the only playback control here now — Loop and Add note
    // are gone, and their space teaches the gestures instead.
    expect(screen.queryByRole('button', { name: 'Loop' })).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add note' })).toBeNull();
    expect(screen.getByText(/Hold the bars and drag/)).toBeTruthy();
    expect(screen.getByText(/Click a note to add a note/)).toBeTruthy();

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

    expect(screen.getByRole('heading', { level: 2, name: /Keep moving/ })).toBeTruthy();
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
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();
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

    // Escape closes the cluster; soprano lock is shown but fixed.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('toolbar')).toBeNull();
    const sopranoCell = container.querySelector('[data-event-id="a-s-1"]');
    if (!(sopranoCell instanceof HTMLElement)) throw new Error('soprano note cell missing');
    fireEvent.click(sopranoCell);
    expect(
      screen
        .getByRole('button', { name: 'The melody is always locked' })
        .hasAttribute('disabled'),
    ).toBe(true);
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
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

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

  it('offers the note slider only once the fragment outgrows the beat window', () => {
    const { container } = render(<HarmonizationWorkbench />);
    // The default fragment is exactly one measure (four beats), so it fits —
    // note COUNT is irrelevant, only how many beats they span.
    expect(screen.queryByRole('slider')).toBeNull();

    // Clicking a note offers a ghost note on each side; taking the trailing
    // one copies that note's length (a half note), pushing the fragment past
    // four beats.
    const cells = sopranoCells(container);
    fireEvent.click(cells[cells.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'Add note after' }));
    expect(screen.getByRole('slider')).toBeTruthy();
  });

  it('Add fragment commits the reading and opens the next one holding its chord', () => {
    const { container } = render(<HarmonizationWorkbench />);
    // Nothing applied yet — there is no hymn to play.
    expect(screen.queryByRole('button', { name: /Play hymn/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add fragment' }));
    expect(screen.getByRole('button', { name: /Play hymn/ })).toBeTruthy();

    // The next fragment opens on one beat per part, held on what the applied
    // piece ended with — four notes, one per lane.
    expect(container.querySelectorAll('[data-event-id]')).toHaveLength(4);
    expect(sopranoCells(container)).toHaveLength(1);

    // The committed piece is a chip with its own audition button.
    const piece = screen.getByRole('button', { name: /1\. I held/ });
    expect(screen.getByRole('button', { name: /Hear this piece/ })).toBeTruthy();

    // Clicking the chip loads it back for rework and says so.
    fireEvent.click(piece);
    expect(screen.getByText(/replace this piece where it stands/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    // Adding again replaces it: still one piece, no second chip.
    fireEvent.click(screen.getByRole('button', { name: 'Add fragment' }));
    expect(screen.queryByText(/replace this piece where it stands/)).toBeNull();
    expect(screen.getByRole('button', { name: /1\. I held/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /2\./ })).toBeNull();
  });

  it('whole-hymn playback leaves the workspace cursor alone', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: 'Add fragment' }));

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
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    fireEvent.click(within(cardB).getByRole('button', { name: 'Stop' }));
    expect(screen.getByText('Playback stopped')).toBeTruthy();
    expect(within(cardB).getByRole('button', { name: 'Hear all four parts' })).toBeTruthy();
  });
});

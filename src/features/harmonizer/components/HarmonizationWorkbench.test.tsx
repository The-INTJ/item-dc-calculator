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

function getCardByTitle(title: string): HTMLElement {
  const cards = screen.getAllByRole('article');
  const card = cards.find((candidate) =>
    within(candidate).queryByRole('heading', { level: 3, name: title }),
  );
  if (!card) throw new Error(`No candidate card titled "${title}"`);
  return card;
}

describe('HarmonizationWorkbench', () => {
  it('renders the workspace-first layout with candidate A preview-selected', () => {
    render(<HarmonizationWorkbench />);

    // Workspace: heading, master play, four voice checkboxes; boundary pills are gone.
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.queryByText('hold harmony')).toBeNull();
    expect(screen.queryByText('change allowed')).toBeNull();

    // Palette below with three clickable cards; A selected, no Select buttons.
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(getCardByTitle('Grounded descent').getAttribute('data-selected')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Select' })).toBeNull();
    expect(screen.queryByRole('button', { name: '▶ SATB' })).toBeNull();
  });

  it('selects a reading by clicking its card', () => {
    render(<HarmonizationWorkbench />);

    const cardC = getCardByTitle('Keep moving');
    fireEvent.click(cardC);

    expect(screen.getByRole('heading', { level: 2, name: /Keep moving/ })).toBeTruthy();
    expect(cardC.getAttribute('data-selected')).toBe('true');
    expect(getCardByTitle('Grounded descent').getAttribute('data-selected')).toBeNull();
    expect(screen.getAllByText('C/E').length).toBeGreaterThan(0);
  });

  it('note tools are live; locking regenerates honestly and freezes the note', () => {
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
    expect(
      screen.getByRole('button', { name: 'Add note before' }).hasAttribute('disabled'),
    ).toBe(false);

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
    const { container } = render(<HarmonizationWorkbench />);
    const sopranoCells = () => {
      const lane = container.querySelector('[data-lane-grid]');
      if (!lane) throw new Error('soprano lane missing');
      return [...lane.querySelectorAll('[data-event-id]')] as HTMLElement[];
    };

    // sol ▼ → fa: the engine regenerates computed CARDS with derivability
    // chips, while the workspace keeps its own (edited) notes.
    fireEvent.click(sopranoCells()[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chord path/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    // ▼ again → mi. The workspace never swapped, so the tool cluster is
    // still open on the same note — press the arrow again directly.
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));

    // Third note ▲ ▲ → sol: engine-first means even mi–fa–sol (fixture D's
    // melody) stays computed — authored demos never outrank live analysis.
    fireEvent.click(sopranoCells()[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));
    expect(screen.getAllByText('Computed').length).toBeGreaterThan(0);
    expect(screen.queryByText('Authored')).toBeNull();

    // The demo is one explicit click away: Samples → fixture D.
    fireEvent.keyDown(window, { key: 'Escape' }); // close the tool cluster
    fireEvent.click(screen.getByRole('button', { name: 'Samples' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Rising melody — build/ }));
    expect(screen.getByRole('heading', { level: 3, name: 'Toward the dominant' })).toBeTruthy();
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
    fireEvent.click(screen.getByRole('button', { name: '▶ Play' }));

    expect(screen.getByText('Playing Soprano + Alto + Tenor')).toBeTruthy();

    // Both the master button and the selected card show Stop; the master is first.
    fireEvent.click(screen.getAllByRole('button', { name: '■ Stop' })[0]);
    expect(screen.getByText('Playback stopped')).toBeTruthy();
  });

  it('offers the note slider only once the fragment outgrows the beat window', () => {
    render(<HarmonizationWorkbench />);
    // The default fragment is exactly one measure (four beats), so it fits —
    // note COUNT is irrelevant, only how many beats they span.
    expect(screen.queryByRole('slider')).toBeNull();

    // Appending copies the last note's length (a half note), pushing the
    // fragment past four beats.
    fireEvent.click(screen.getByRole('button', { name: '+ Add note' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Soprano' }));
    expect(screen.getByRole('slider')).toBeTruthy();
  });

  it('applied pieces become a playable hymn you can click back open', () => {
    render(<HarmonizationWorkbench />);
    // Nothing applied yet — there is no hymn to play.
    expect(screen.queryByRole('button', { name: /Play hymn/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Apply to composition' }));
    expect(screen.getByRole('button', { name: /Play hymn/ })).toBeTruthy();

    // The chooser opens for the next fragment; stay on this one.
    fireEvent.click(screen.getByRole('button', { name: /Keep working here/ }));

    // The piece is a chip with its own audition button.
    const piece = screen.getByRole('button', { name: /1\. I held/ });
    expect(screen.getByRole('button', { name: /Hear this piece/ })).toBeTruthy();

    // Clicking the chip loads it back for rework and says so.
    fireEvent.click(piece);
    expect(screen.getByText(/Apply will replace this piece where it stands/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    // Applying again replaces it: still one piece, no second chip.
    fireEvent.click(screen.getByRole('button', { name: 'Apply to composition' }));
    expect(screen.queryByText(/Apply will replace this piece/)).toBeNull();
    expect(screen.getByRole('button', { name: /1\. I held/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /2\./ })).toBeNull();
  });

  it('whole-hymn playback leaves the workspace cursor alone', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply to composition' }));
    fireEvent.click(screen.getByRole('button', { name: /Keep working here/ }));

    fireEvent.click(screen.getByRole('button', { name: /Play hymn/ }));
    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    // The hymn runs on its own timeline, so no workspace note lights up.
    expect(container.querySelector('[data-active]')).toBeNull();
    expect(screen.getByRole('button', { name: /Stop/ })).toBeTruthy();
  });

  it('audition from a card plays all voices without changing the selection', () => {
    render(<HarmonizationWorkbench />);

    const cardB = getCardByTitle('Strong arrival');
    fireEvent.click(within(cardB).getByRole('button', { name: /Full/ }));

    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    // The play button stops propagation — the selection stays on A.
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    fireEvent.click(within(cardB).getByRole('button', { name: /Stop/ }));
    expect(screen.getByText('Playback stopped')).toBeTruthy();
    expect(within(cardB).getByRole('button', { name: /Full/ })).toBeTruthy();
  });
});

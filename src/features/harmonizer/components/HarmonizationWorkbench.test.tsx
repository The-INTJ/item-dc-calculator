import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

    // Locking whole-bar E against the melody's fa is mathematically
    // unsatisfiable — the WORKSPACE stays exactly as it is (the surface
    // rule), while sketch cards appear showing the impossible span as ? with
    // its sounding notes (never a dead-end notice).
    fireEvent.click(screen.getByRole('button', { name: 'Lock note' }));
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();
    expect(altoCell.getAttribute('data-locked')).toBe('true');
    expect(screen.getAllByText('Computed (naive)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/E\+F/).length).toBeGreaterThan(0);
    // The locked note is frozen; the cluster never closed (workspace intact).
    expect(
      screen.getByRole('button', { name: 'Raise pitch' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock note' }));
    expect(screen.queryByText('Computed (naive)')).toBeNull();

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

  it('hero flow: arrows carry the melody through computed skeletons into fixture D', () => {
    const { container } = render(<HarmonizationWorkbench />);
    const sopranoCells = () => {
      const lane = container.querySelector('[data-lane-grid]');
      if (!lane) throw new Error('soprano lane missing');
      return [...lane.querySelectorAll('[data-event-id]')] as HTMLElement[];
    };

    // sol ▼ → fa: unknown melody → computed skeleton CARDS appear with
    // derivability chips, while the workspace keeps its own (edited) notes.
    fireEvent.click(sopranoCells()[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));
    expect(screen.getAllByText('Computed (naive)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chord path/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();

    // ▼ again → mi. The workspace never swapped, so the tool cluster is
    // still open on the same note — press the arrow again directly.
    fireEvent.click(screen.getByRole('button', { name: 'Lower pitch' }));

    // Third note ▲ ▲ → sol: mi–fa–sol matches fixture D → authored cards.
    fireEvent.click(sopranoCells()[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));
    fireEvent.click(screen.getByRole('button', { name: 'Raise pitch' }));

    expect(screen.getByRole('heading', { level: 3, name: 'Toward the dominant' })).toBeTruthy();
    expect(screen.getAllByText('Authored').length).toBeGreaterThan(0);

    // Undo walks the whole journey back.
    const undo = () => fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    undo();
    undo();
    undo();
    undo();
    expect(screen.getByRole('heading', { level: 3, name: 'Grounded descent' })).toBeTruthy();
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

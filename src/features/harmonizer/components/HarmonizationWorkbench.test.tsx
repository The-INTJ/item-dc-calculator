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

    // Workspace: heading, master play, four voice checkboxes, boundary chips.
    expect(screen.getByRole('heading', { level: 2, name: /Grounded descent/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getByText('hold harmony')).toBeTruthy();
    expect(screen.getByText('change allowed')).toBeTruthy();

    // Palette below with three cards; A selected.
    expect(screen.getAllByRole('article')).toHaveLength(3);
    const cardA = getCardByTitle('Grounded descent');
    expect(
      within(cardA).getByRole('button', { name: 'Selected' }).getAttribute('aria-pressed'),
    ).toBe('true');

    // The old transport buttons are gone.
    expect(screen.queryByRole('button', { name: '▶ SATB' })).toBeNull();
    expect(screen.queryByRole('button', { name: '▶ Harmony' })).toBeNull();
  });

  it('updates the workspace when another candidate is selected', () => {
    render(<HarmonizationWorkbench />);

    const cardC = getCardByTitle('Keep moving');
    fireEvent.click(within(cardC).getByRole('button', { name: 'Select' }));

    expect(screen.getByRole('heading', { level: 2, name: /Keep moving/ })).toBeTruthy();
    expect(
      within(cardC).getByRole('button', { name: 'Selected' }).getAttribute('aria-pressed'),
    ).toBe('true');
    // The workspace shows candidate C's chord path from the wireframe voicing.
    expect(screen.getAllByText('C/E').length).toBeGreaterThan(0);
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

  it('audition from a card plays all four voices and can be stopped there', () => {
    render(<HarmonizationWorkbench />);

    const cardB = getCardByTitle('Strong arrival');
    fireEvent.click(within(cardB).getByRole('button', { name: /Full/ }));

    expect(screen.getByText('Playing all four voices')).toBeTruthy();
    fireEvent.click(within(cardB).getByRole('button', { name: /Stop/ }));
    expect(screen.getByText('Playback stopped')).toBeTruthy();
    expect(within(cardB).getByRole('button', { name: /Full/ })).toBeTruthy();
  });
});

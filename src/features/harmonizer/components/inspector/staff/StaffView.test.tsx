import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HarmonizationWorkbench } from '../../HarmonizationWorkbench';
import { getDefaultFixture, getFixtureById } from '../../../fixtures/registry';
import { UNITS_PER_MEASURE } from '../../../domain/timing';
import { StaffView } from './StaffView';

vi.mock('../../../services/tone-playback-service', () => {
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

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const defaultFixture = getDefaultFixture();
const aMinorFixture = getFixtureById('a-minor-la-ti-do-continue')!;

function renderStaff(fixture = defaultFixture, candidateId?: string) {
  const candidates = fixture.candidateSets[0].candidates;
  const candidate = candidateId
    ? candidates.find((entry) => entry.id === candidateId)!
    : candidates[0];
  return render(
    <StaffView
      candidate={candidate}
      tonalContext={fixture.initialState.tonalContext}
      gridUnits={UNITS_PER_MEASURE}
    />,
  );
}

function notationSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: 'Notation' });
}

describe('the notation setting', () => {
  it('opens on the lanes, so nothing changes for anyone who never touches it', () => {
    const { container } = render(<HarmonizationWorkbench />);
    expect(notationSelect().value).toBe('lanes');
    expect(container.querySelector('[data-lane-grid]')).not.toBeNull();
    expect(container.querySelector('[data-staff-system]')).toBeNull();
  });

  it('offers the lanes, the staff, and both together', () => {
    render(<HarmonizationWorkbench />);
    expect([...notationSelect().options].map((option) => option.value)).toEqual([
      'lanes',
      'staff',
      'both',
    ]);
  });

  it('shows the staff instead of the lanes', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.change(notationSelect(), { target: { value: 'staff' } });
    expect(container.querySelector('[data-staff-system]')).not.toBeNull();
    expect(container.querySelector('[data-lane-grid]')).toBeNull();
  });

  it('shows both at once — the arrangement Drew works in', () => {
    const { container } = render(<HarmonizationWorkbench />);
    fireEvent.change(notationSelect(), { target: { value: 'both' } });
    expect(container.querySelector('[data-staff-system]')).not.toBeNull();
    expect(container.querySelector('[data-lane-grid]')).not.toBeNull();
  });

  it('remembers the choice across a visit', () => {
    const first = render(<HarmonizationWorkbench />);
    fireEvent.change(notationSelect(), { target: { value: 'both' } });
    expect(window.localStorage.getItem('harmonizer.view.v1')).toBe('both');
    first.unmount();

    const { container } = render(<HarmonizationWorkbench />);
    expect(notationSelect().value).toBe('both');
    expect(container.querySelector('[data-staff-system]')).not.toBeNull();
  });

  it('falls back to the lanes if the stored choice is nonsense', () => {
    window.localStorage.setItem('harmonizer.view.v1', 'hologram');
    const { container } = render(<HarmonizationWorkbench />);
    expect(notationSelect().value).toBe('lanes');
    expect(container.querySelector('[data-staff-system]')).toBeNull();
  });

  it('keeps the chord row and transport whichever view is showing', () => {
    render(<HarmonizationWorkbench />);
    fireEvent.change(notationSelect(), { target: { value: 'staff' } });
    // The staff replaces the lanes, not the rest of the editor around them.
    expect(screen.getByRole('heading', { level: 2, name: 'Current measure' })).toBeTruthy();
  });
});

describe('the staff view', () => {

  it('draws a notehead per written note, shaped by degree', () => {
    const { container } = renderStaff();
    const heads = [...container.querySelectorAll('[data-shape]')];
    // Three soprano notes over a whole note in each of the three lower voices.
    expect(heads).toHaveLength(6);
    const shapes = heads.map((head) => head.getAttribute('data-shape'));
    expect(new Set(shapes).size).toBeGreaterThan(1);
  });

  it('opens the heads of long notes and fills the short ones', () => {
    const { container } = renderStaff();
    const bases = [...container.querySelectorAll('[data-shape]')].map((head) =>
      head.getAttribute('data-base'),
    );
    expect(bases).toContain('w');
    expect(bases).toContain('q');
  });

  it('prints the key signature once per stave', () => {
    // E flat major would print three flats on each of the two staves; the
    // default fixture is C major and prints none.
    const { container } = renderStaff();
    expect(container.querySelectorAll('[data-staff-system]')).toHaveLength(1);
  });

  it('rests the beats a voice does not sing', () => {
    const { container } = renderStaff(aMinorFixture, 'deceptive-turn');
    // Every stave accounts for the full measure, so any silence is drawn.
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(6);
  });

  it('ties a note whose length has no symbol of its own', () => {
    // Five sixteenths cannot be written as one note, so the staff has to show a
    // quarter tied to a sixteenth — two heads and one arc for a single note.
    const candidate = defaultFixture.candidateSets[0].candidates[0];
    const soprano = candidate.voicing.soprano;
    const stretched = {
      ...candidate,
      voicing: {
        ...candidate.voicing,
        soprano: [
          { ...soprano[0], duration: { numerator: 5, denominator: 16 } },
          ...soprano.slice(1),
        ],
      },
    };
    const { container } = render(
      <StaffView
        candidate={stretched}
        tonalContext={defaultFixture.initialState.tonalContext}
        gridUnits={UNITS_PER_MEASURE}
      />,
    );
    const heads = [...container.querySelectorAll('[data-shape]')];
    const bases = heads.map((head) => head.getAttribute('data-base'));
    expect(bases).toContain('q');
    expect(bases).toContain('s');
    // Both halves of the tied note wear the same shape — it is one note.
    const sol = heads.filter((head) => head.getAttribute('data-shape') === 'round');
    expect(sol.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('svg[viewBox="0 0 100 20"]')).toHaveLength(1);
  });

  it('offers nothing to press when it has not been granted editing', () => {
    const { container } = renderStaff();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('keeps the whole drawing out of the accessibility tree', () => {
    const { container } = renderStaff();
    for (const mark of container.querySelectorAll('svg')) {
      expect(mark.getAttribute('aria-hidden')).toBe('true');
    }
    // Nothing here announces itself: the notes are read from the lanes until
    // the staff becomes the editing surface.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

/** The staff with editing granted, driven through the real workbench. */
function renderEditableStaff() {
  const view = render(<HarmonizationWorkbench />);
  fireEvent.change(notationSelect(), { target: { value: 'staff' } });
  return view;
}

function noteHits(container: HTMLElement): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>('[data-staff-system] button[data-event-id]'),
  ];
}

function grid(): HTMLElement | null {
  return screen.queryByRole('group', { name: 'Change this note' });
}

describe('the tap-to-edit grid', () => {
  it('gives every note a target once editing is granted', () => {
    const { container } = renderEditableStaff();
    expect(noteHits(container).length).toBeGreaterThan(0);
    expect(grid()).toBeNull();
  });

  it('opens the moment a note is tapped', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    expect(grid()).not.toBeNull();
  });

  it('puts the tapped note in the middle, two steps reachable each way', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    const cells = within(grid()!).getAllByRole('button');
    // Five by five, plus the close button hovering off the corner.
    expect(cells.filter((cell) => cell.getAttribute('aria-label') !== 'Close')).toHaveLength(25);
    expect(within(grid()!).getByRole('button', { name: 'Keep this note' })).toBeTruthy();
  });

  it('changes the note and STAYS OPEN, re-centred on the new note', () => {
    const { container } = renderEditableStaff();
    const before = container.querySelector('[data-staff-system] [data-shape]')!;
    expect(before.getAttribute('data-shape')).toBe('round');

    fireEvent.click(noteHits(container)[0]);
    fireEvent.click(within(grid()!).getByRole('button', { name: '1 higher, same length' }));

    // The staff followed the change...
    expect(
      container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-shape'),
    ).toBe('square');
    // ...and the grid is still open, ready for the next step in the same direction.
    expect(grid()).not.toBeNull();
    expect(within(grid()!).getByRole('button', { name: 'Keep this note' })).toBeTruthy();
  });

  it('reaches a distant note by repeating the same small step', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    const shapes: (string | null)[] = [];
    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(within(grid()!).getByRole('button', { name: '2 higher, same length' }));
      shapes.push(
        container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-shape'),
      );
    }
    // Two steps at a time from sol: ti, then re, then fa — six scale steps
    // covered without the grid ever closing or changing shape.
    expect(shapes).toEqual(['triangleRound', 'moon', 'triangleSide']);
    expect(grid()).not.toBeNull();
  });

  it('changes a note‘s length from the same grid', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    expect(container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-base'))
      .toBe('q');
    fireEvent.click(within(grid()!).getByRole('button', { name: 'same pitch, 1 longer' }));
    expect(container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-base'))
      .toBe('q');
    // A quarter stepped one rung longer is a dotted quarter: same head, one dot.
    expect(container.querySelector('[data-staff-system] [data-shape]')).toBeTruthy();
  });

  it('closes on the X, on Escape, and on tapping the open note again', () => {
    const { container } = renderEditableStaff();

    fireEvent.click(noteHits(container)[0]);
    fireEvent.click(within(grid()!).getByRole('button', { name: 'Close' }));
    expect(grid()).toBeNull();

    fireEvent.click(noteHits(container)[0]);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(grid()).toBeNull();

    fireEvent.click(noteHits(container)[0]);
    fireEvent.click(noteHits(container)[0]);
    expect(grid()).toBeNull();
  });

  it('empties the cells that run past the ends of the ladder', () => {
    const { container } = renderEditableStaff();
    // The alto is a whole note — the longest the ladder goes — so its "longer"
    // cells have nothing to offer rather than repeating themselves.
    const whole = noteHits(container).find(
      (hit) =>
        container
          .querySelector(`[data-staff-system] [data-base="w"]`) !== null &&
        hit.getAttribute('data-event-id')?.startsWith('a-a'),
    );
    fireEvent.click(whole ?? noteHits(container)[1]);
    const disabled = within(grid()!)
      .getAllByRole('button')
      .filter((cell) => (cell as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThan(0);
  });
});

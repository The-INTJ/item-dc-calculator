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

function addButton(container: HTMLElement, voice: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(
    `[data-staff-system] button[data-voice="${voice}"]`,
  )!;
}

function heads(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('[data-staff-system] [data-shape]')];
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

  it('puts the tapped note in the middle, three steps reachable each way', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    // Seven by seven. The close button and the footer's controls live outside
    // the cell grid, which is why the count is taken from the grid itself.
    expect(grid()!.querySelectorAll('[data-note-grid] button')).toHaveLength(49);
    expect(within(grid()!).getByRole('button', { name: 'Keep this note' })).toBeTruthy();
  });

  it('changes the note and STAYS OPEN, re-centred on the new note', () => {
    const { container } = renderEditableStaff();
    const before = container.querySelector('[data-staff-system] [data-shape]')!;
    expect(before.getAttribute('data-shape')).toBe('round');

    // Two half steps above sol is la — a whole tone, so no accidental.
    fireEvent.click(noteHits(container)[0]);
    fireEvent.click(within(grid()!).getByRole('button', { name: '2 half steps higher, same length' }));

    // The staff followed the change...
    expect(
      container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-shape'),
    ).toBe('square');
    // ...and the grid is still open, ready for the next step in the same direction.
    expect(grid()).not.toBeNull();
    expect(within(grid()!).getByRole('button', { name: 'Keep this note' })).toBeTruthy();
  });

  it('keeps the degree‘s shape when a half step lands between two degrees', () => {
    const { container } = renderEditableStaff();
    const head = () => container.querySelector('[data-staff-system] [data-shape]')!;
    expect(head().getAttribute('data-shape')).toBe('round');

    fireEvent.click(noteHits(container)[0]);
    fireEvent.click(within(grid()!).getByRole('button', { name: '1 half step higher, same length' }));

    // A half step above sol is si — a RAISED SOL, not a flattened la. It keeps
    // sol's round head and says the rest with a sharp, which is the whole
    // reason the shape is read off the degree and never off the syllable.
    expect(head().getAttribute('data-shape')).toBe('round');
    expect(head().getAttribute('data-accidental')).toBe('#');
  });

  it('reaches a distant note by repeating the same small step', () => {
    const { container } = renderEditableStaff();
    fireEvent.click(noteHits(container)[0]);
    const shapes: (string | null)[] = [];
    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(
        within(grid()!).getByRole('button', { name: '3 half steps higher, same length' }),
      );
      shapes.push(
        container.querySelector('[data-staff-system] [data-shape]')!.getAttribute('data-shape'),
      );
    }
    // Minor thirds up from sol: la-sharp, then do-sharp, then mi — nine
    // semitones covered without the grid ever closing, each landing note
    // wearing its own degree's shape.
    expect(shapes).toEqual(['square', 'triangleUp', 'diamond']);
    expect(grid()).not.toBeNull();
  });

  it('changes a note‘s length from the same grid', () => {
    const { container } = renderEditableStaff();
    const bases = () =>
      [...container.querySelectorAll('[data-staff-system] [data-base]')].map((head) =>
        head.getAttribute('data-base'),
      );
    fireEvent.click(noteHits(container)[0]);
    expect(bases()[0]).toBe('q');

    // The cell says it in its own name: five sixteenths is written tied.
    fireEvent.click(
      within(grid()!).getByRole('button', { name: 'same pitch, 1 sixteenth longer, written tied' }),
    );

    // A quarter on the beat plus one sixteenth is five sixteenths, which has no
    // symbol of its own — so the staff draws the quarter tied to a sixteenth.
    expect(bases()).toContain('s');
    expect(container.querySelectorAll('svg[viewBox="0 0 100 20"]')).toHaveLength(1);
  });

  it('takes a whole grid click back in one undo', () => {
    const { container } = renderEditableStaff();
    const head = () => container.querySelector('[data-staff-system] [data-shape]')!;
    const before = { shape: head().getAttribute('data-shape'), base: head().getAttribute('data-base') };

    fireEvent.click(noteHits(container)[0]);
    // A corner cell moves pitch AND length at once — three dispatches for one
    // click, which the user experienced as one thing and undoes as one thing.
    fireEvent.click(
      within(grid()!).getByRole('button', {
        name: '3 half steps higher, 1 sixteenth longer, written tied',
      }),
    );
    expect(head().getAttribute('data-shape')).not.toBe(before.shape);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(head().getAttribute('data-shape')).toBe(before.shape);
    expect(head().getAttribute('data-base')).toBe(before.base);
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

  it('empties the cells that run past the shortest and longest a note may be', () => {
    const { container } = renderEditableStaff();
    // The alto is a whole note — a full measure, the longest a note goes — so
    // its "longer" cells have nothing to offer rather than repeating themselves.
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

describe('silencing and deleting from the grid', () => {
  function footerButton(name: string): HTMLButtonElement {
    return within(grid()!).getByRole('button', { name }) as HTMLButtonElement;
  }

  it('turns a note into a rest and back, keeping everything but the sound', () => {
    const { container } = renderEditableStaff();
    const sopranoHeads = () =>
      [...container.querySelectorAll('[data-staff-system] [data-voice="soprano"][data-shape]')];
    const before = sopranoHeads().length;

    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-s-1"]')!);
    expect(footerButton('Note').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(footerButton('Rest'));

    // The head is gone from the staff...
    expect(sopranoHeads()).toHaveLength(before - 1);
    // ...but the note is still THERE: it kept its place, so it is still
    // reachable, and the grid still knows which note it is.
    expect(footerButton('Rest').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-staff-system] button[data-rest]')).not.toBeNull();

    fireEvent.click(footerButton('Note'));
    expect(sopranoHeads()).toHaveLength(before);
  });

  it('says so in the lanes as well — one silence, both views', () => {
    render(<HarmonizationWorkbench />);
    fireEvent.change(notationSelect(), { target: { value: 'both' } });
    const cell = () => document.querySelector('[data-lane-grid] [data-event-id="a-s-1"]');
    expect(cell()!.getAttribute('data-rest')).toBeNull();

    fireEvent.click(
      document.querySelector<HTMLElement>('[data-staff-system] button[data-event-id="a-s-1"]')!,
    );
    fireEvent.click(within(grid()!).getByRole('button', { name: 'Rest' }));

    expect(cell()!.getAttribute('data-rest')).toBe('true');
    expect(cell()!.textContent).toContain('rest');
  });

  it('deletes the note and closes, since there is nothing left to stay open on', () => {
    const { container } = renderEditableStaff();
    const sopranoHeads = () =>
      [...container.querySelectorAll('[data-staff-system] [data-voice="soprano"][data-shape]')];
    const before = sopranoHeads().length;

    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-s-1"]')!);
    fireEvent.click(footerButton('Delete this note'));

    expect(sopranoHeads()).toHaveLength(before - 1);
    expect(grid()).toBeNull();
  });

  it('leaves a deleted note as a rest you can click and take back', () => {
    const { container } = renderEditableStaff();
    const sopranoHeads = () =>
      [...container.querySelectorAll('[data-staff-system] [data-voice="soprano"][data-shape]')];
    const before = sopranoHeads().length;

    // Delete the FIRST soprano note. The notes after it move up to close the
    // gap, and the time it held reappears as a rest at the end of the part.
    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-s-1"]')!);
    fireEvent.click(footerButton('Delete this note'));
    expect(sopranoHeads()).toHaveLength(before - 1);

    // That rest is a real thing on the staff, not a hole: it has a target.
    const restHit = container.querySelector<HTMLElement>(
      '[data-staff-system] button[data-rest][data-event-id="a-s-1"]',
    );
    expect(restHit).not.toBeNull();

    // Clicking it opens the grid, which offers the note back.
    fireEvent.click(restHit!);
    expect(footerButton('Rest').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(footerButton('Note'));
    expect(sopranoHeads()).toHaveLength(before);
  });

  it('frees no room by deleting, so the measure can never be violated', () => {
    const { container } = renderEditableStaff();
    expect(addButton(container, 'soprano').disabled).toBe(true);

    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-s-1"]')!);
    fireEvent.click(footerButton('Delete this note'));

    // The part is still exactly a measure long — the deleted note's time is
    // still spoken for, as a rest.
    expect(addButton(container, 'soprano').disabled).toBe(true);
  });

  it('will not delete a part‘s last note — silencing is how you empty a part', () => {
    const { container } = renderEditableStaff();
    // The alto is a single whole note, so deleting it would leave the part with
    // nothing. The button stays, disabled, rather than lying about what it does.
    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-a-1"]')!);
    expect(footerButton('Delete this note').disabled).toBe(true);
    expect(footerButton('Rest').disabled).toBe(false);
  });
});

describe('adding a note from the staff', () => {
  it('gives every part its own plus, named for the part', () => {
    const { container } = renderEditableStaff();
    expect(addButton(container, 'soprano').getAttribute('aria-label')).toBe('Add a soprano note');
    expect(addButton(container, 'alto').getAttribute('aria-label')).toBe('Add an alto note');
    expect(addButton(container, 'tenor')).toBeTruthy();
    expect(addButton(container, 'bass')).toBeTruthy();
  });

  it('greys out the plus of a part that already fills the measure', () => {
    const { container } = renderEditableStaff();
    // Every part of the default reading fills the bar, so there is nowhere for
    // another note to go — and the button says so rather than disappearing.
    for (const voice of ['soprano', 'alto', 'tenor', 'bass']) {
      expect(addButton(container, voice).disabled).toBe(true);
    }
  });

  it('offers nothing to add when the staff is only a picture', () => {
    const { container } = renderStaff();
    expect(container.querySelector('button[data-voice]')).toBeNull();
  });

  it('adds a note that takes the room left, and opens the grid on it', () => {
    const { container } = renderEditableStaff();

    // Make room: shorten the alto's whole note by three sixteenths. Thirteen
    // sixteenths has no symbol of its own, hence the tie in the cell's name.
    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-a-1"]')!);
    fireEvent.click(
      within(grid()!).getByRole('button', {
        name: 'same pitch, 3 sixteenths shorter, written tied',
      }),
    );
    fireEvent.click(within(grid()!).getByRole('button', { name: 'Close' }));
    expect(addButton(container, 'alto').disabled).toBe(false);

    const before = heads(container).length;
    fireEvent.click(addButton(container, 'alto'));

    // The note before it was far too long to copy into three sixteenths, so
    // the new note took the room instead of refusing to appear...
    expect(heads(container)).toHaveLength(before + 1);
    // ...the measure is full again...
    expect(addButton(container, 'alto').disabled).toBe(true);
    // ...and the grid is already open on it, so the guessed note is one tap
    // from being whatever it should have been.
    expect(grid()).not.toBeNull();
  });

  it('copies the note before it when that note fits', () => {
    const { container } = renderEditableStaff();

    // Halve the alto, leaving room for a note exactly its own length. The way
    // down passes through lengths that need a tie, and lands on one that does
    // not — a half note.
    fireEvent.click(container.querySelector<HTMLElement>('[data-event-id="a-a-1"]')!);
    for (let taken = 0; taken < 2; taken += 1) {
      fireEvent.click(
        within(grid()!).getByRole('button', {
          name: 'same pitch, 3 sixteenths shorter, written tied',
        }),
      );
    }
    fireEvent.click(
      within(grid()!).getByRole('button', { name: 'same pitch, 2 sixteenths shorter' }),
    );
    fireEvent.click(within(grid()!).getByRole('button', { name: 'Close' }));

    fireEvent.click(addButton(container, 'alto'));
    // The alto is now two half notes: the new one matched the one before it
    // exactly, because this time it fit.
    const alto = heads(container).filter((head) => head.getAttribute('data-voice') === 'alto');
    expect(alto.map((head) => head.getAttribute('data-base'))).toEqual(['h', 'h']);
    expect(addButton(container, 'alto').disabled).toBe(true);
  });
});

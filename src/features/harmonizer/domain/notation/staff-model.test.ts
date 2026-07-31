import { describe, expect, it } from 'vitest';
import { getFixtureById, getDefaultFixture } from '../../fixtures/registry';
import type { SATBVoicing, TonalContext, VoiceEvent } from '../music-types';
import { spellPitch } from '../pitch';
import { UNITS_PER_MEASURE } from '../timing';
import { buildStaffModel } from './staff-model';
import type { NoteSymbol, StaffStave } from './staff-types';

const defaultFixture = getDefaultFixture();
const aMinorFixture = getFixtureById('a-minor-la-ti-do-continue')!;

function firstVoicing(fixture: typeof defaultFixture): SATBVoicing {
  return fixture.candidateSets[0].candidates[0].voicing;
}

function staveOf(model: ReturnType<typeof buildStaffModel>, id: 'treble' | 'bass'): StaffStave {
  return model.staves.find((stave) => stave.stave === id)!;
}

function notesOf(stave: StaffStave, voice: string): NoteSymbol[] {
  return stave.notes.filter((note) => note.voice === voice);
}

/** A voice built by hand, for the cases no fixture happens to cover. */
function voice(events: Partial<VoiceEvent>[], name: VoiceEvent['voice']): VoiceEvent[] {
  return events.map((event, index) => ({
    id: `${name}-${index}`,
    voice: name,
    pitch: spellPitch('C', 'natural', 4),
    scaleDegree: { degree: 1, chromaticOffset: 0, syllable: 'do' },
    start: { measure: 1, beat: 1, subdivision: 0 },
    duration: { numerator: 1, denominator: 4 },
    tieFromPrevious: false,
    ...event,
  })) as VoiceEvent[];
}

describe('buildStaffModel', () => {
  const context = defaultFixture.initialState.tonalContext;
  const model = buildStaffModel(firstVoicing(defaultFixture), context, UNITS_PER_MEASURE);

  it('lays the four voices onto two staves', () => {
    expect(model.staves.map((stave) => stave.stave)).toEqual(['treble', 'bass']);
    expect(new Set(staveOf(model, 'treble').notes.map((n) => n.voice))).toEqual(
      new Set(['soprano', 'alto']),
    );
    expect(new Set(staveOf(model, 'bass').notes.map((n) => n.voice))).toEqual(
      new Set(['tenor', 'bass']),
    );
  });

  it('keeps the voices rhythmically independent', () => {
    // The default reading is three soprano notes against a whole note in each
    // lower voice — the case a grand staff has to handle and a lane never did.
    expect(notesOf(staveOf(model, 'treble'), 'soprano')).toHaveLength(3);
    expect(notesOf(staveOf(model, 'treble'), 'alto')).toHaveLength(1);
    expect(notesOf(staveOf(model, 'bass'), 'bass')).toHaveLength(1);
    expect(notesOf(staveOf(model, 'treble'), 'alto')[0].base).toBe('w');
  });

  it('stems each stave‘s upper voice up and its lower voice down', () => {
    expect(notesOf(staveOf(model, 'treble'), 'soprano').every((n) => n.stem === 'up')).toBe(true);
    expect(notesOf(staveOf(model, 'treble'), 'alto').every((n) => n.stem === 'down')).toBe(true);
    expect(notesOf(staveOf(model, 'bass'), 'tenor').every((n) => n.stem === 'up')).toBe(true);
    expect(notesOf(staveOf(model, 'bass'), 'bass').every((n) => n.stem === 'down')).toBe(true);
  });

  it('gives every notehead a shape and a step', () => {
    for (const stave of model.staves) {
      for (const note of stave.notes) {
        expect(note.shape, note.id).not.toBeNull();
        expect(Number.isInteger(note.step), note.id).toBe(true);
      }
    }
  });

  it('frames the measure', () => {
    expect(model.gridUnits).toBe(UNITS_PER_MEASURE);
    expect(model.timeSignature).toBe('4/4');
    expect(model.barlineUnits).toEqual([0]);
    // C major: no signature to print.
    expect(staveOf(model, 'treble').keySignature).toEqual([]);
  });

  it('is serializable, so it can be snapshotted and handed to any renderer', () => {
    expect(() => JSON.parse(JSON.stringify(model))).not.toThrow();
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
  });
});

describe('a raised leading tone', () => {
  it('keeps its degree‘s shape and carries the accidental', () => {
    // The a-minor fixture authors si as deg(7,'si',+1) → G#, live in its
    // "deceptive turn" reading. Degree 7 of la-based minor is sol, so the head
    // stays round and the sharp prints beside it.
    const context = aMinorFixture.initialState.tonalContext;
    const deceptive = aMinorFixture.candidateSets[0].candidates.find(
      (candidate) => candidate.id === 'deceptive-turn',
    );
    if (!deceptive) throw new Error('the deceptive-turn reading is missing');
    const model = buildStaffModel(deceptive.voicing, context, UNITS_PER_MEASURE);
    const sharped = model.staves
      .flatMap((stave) => stave.notes)
      .filter((note) => note.accidental === '#');
    expect(sharped.length).toBeGreaterThan(0);
    for (const note of sharped) {
      expect(note.shape, note.id).toBe('round');
    }
  });
});

describe('gaps and collisions', () => {
  const context: TonalContext = defaultFixture.initialState.tonalContext;

  function modelFor(voicing: Partial<SATBVoicing>) {
    const empty = { soprano: [], alto: [], tenor: [], bass: [] };
    return buildStaffModel({ ...empty, ...voicing } as SATBVoicing, context, UNITS_PER_MEASURE);
  }

  it('fills a silent voice with rests across the whole measure', () => {
    const model = modelFor({});
    const rests = staveOf(model, 'treble').rests.filter((rest) => rest.voice === 'soprano');
    expect(rests).toHaveLength(1);
    expect(rests[0].base).toBe('w');
    expect(rests[0].units).toBe(UNITS_PER_MEASURE);
  });

  it('rests the beats a voice leaves empty before and after its notes', () => {
    const model = modelFor({
      soprano: voice([{ start: { measure: 1, beat: 2, subdivision: 0 } }], 'soprano'),
    });
    const rests = staveOf(model, 'treble')
      .rests.filter((rest) => rest.voice === 'soprano')
      .map((rest) => `${rest.base}@${rest.startUnit}`);
    // A quarter rest on beat 1, then a half rest covering beats 3 and 4.
    expect(rests).toEqual(['q@0', 'h@8']);
  });

  it('keeps a resting voice clear of the voice still singing', () => {
    // Two voices share a stave, so a rest left in the middle sits exactly where
    // the other voice is singing. B4 is the treble stave's middle line — the
    // rest's own home — which is why this is the case that had to be fixed.
    const model = modelFor({
      alto: voice([{ pitch: spellPitch('B', 'natural', 4) }], 'alto'),
    });
    const treble = staveOf(model, 'treble');
    const sopranoRest = treble.rests.find((rest) => rest.voice === 'soprano')!;
    const altoNote = notesOf(treble, 'alto')[0];
    expect(sopranoRest.step).not.toBe(altoNote.step);
    expect(sopranoRest.step).toBeLessThan(altoNote.step);
  });

  it('separates the two voices‘ rests when both are silent', () => {
    const model = modelFor({});
    for (const stave of model.staves) {
      const steps = stave.rests.map((rest) => rest.step);
      expect(new Set(steps).size, stave.stave).toBe(steps.length);
    }
  });

  it('nudges the lower voice when both strike a unison', () => {
    const both = voice([{ pitch: spellPitch('C', 'natural', 4) }], 'soprano');
    const model = modelFor({
      soprano: both,
      alto: voice([{ pitch: spellPitch('C', 'natural', 4) }], 'alto'),
    });
    const treble = staveOf(model, 'treble');
    expect(notesOf(treble, 'soprano')[0].offsetHead).toBe(false);
    expect(notesOf(treble, 'alto')[0].offsetHead).toBe(true);
  });

  it('leaves comfortably spaced voices alone', () => {
    const model = modelFor({
      soprano: voice([{ pitch: spellPitch('G', 'natural', 4) }], 'soprano'),
      alto: voice([{ pitch: spellPitch('C', 'natural', 4) }], 'alto'),
    });
    expect(staveOf(model, 'treble').notes.every((note) => !note.offsetHead)).toBe(true);
  });

  it('does not treat overlapping-but-later notes as a collision', () => {
    // Only heads that begin together can clash; a note already sounding sits
    // further left and is never in the way.
    const model = modelFor({
      soprano: voice(
        [{ pitch: spellPitch('C', 'natural', 4), duration: { numerator: 1, denominator: 1 } }],
        'soprano',
      ),
      alto: voice(
        [{ pitch: spellPitch('C', 'natural', 4), start: { measure: 1, beat: 3, subdivision: 0 } }],
        'alto',
      ),
    });
    expect(staveOf(model, 'treble').notes.every((note) => !note.offsetHead)).toBe(true);
  });
});

describe('content that outgrew its measure', () => {
  it('draws a barline per measure and ties notes across them', () => {
    const context = defaultFixture.initialState.tonalContext;
    const long = buildStaffModel(
      {
        soprano: voice(
          [{ duration: { numerator: 3, denominator: 2 } }], // 24 units: a bar and a half
          'soprano',
        ),
        alto: [],
        tenor: [],
        bass: [],
      },
      context,
      2 * UNITS_PER_MEASURE,
    );
    expect(long.barlineUnits).toEqual([0, UNITS_PER_MEASURE]);
    const soprano = notesOf(staveOf(long, 'treble'), 'soprano');
    expect(soprano.map((note) => note.base)).toEqual(['w', 'h']);
    expect(soprano[0].tieToNext).toBe(true);
    expect(soprano[1].startUnit).toBe(UNITS_PER_MEASURE);
  });
});

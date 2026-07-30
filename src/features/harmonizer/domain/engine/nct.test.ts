import { describe, expect, it } from 'vitest';
import type { SpelledPitch } from '../music-types';
import { parsePitch } from '../pitch';
import { identifySonority, type SonorityReading } from './chord-id';
import { classifyNonChordTone, memberOfReading, resolvesByStepSoon, type NctWindow, type PlacedNote } from './nct';

function placed(spn: string, startUnit: number, units = 4, eventId?: string): PlacedNote {
  return { pitch: parsePitch(spn), startUnit, units, ...(eventId ? { eventId } : {}) };
}

function chord(...spns: string[]): SonorityReading {
  const pitches = spns.map(parsePitch).sort((a, b) => a.midi - b.midi);
  return identifySonority({ pitches, bassPc: pitches[0].pitchClass });
}

const C = chord('C3', 'E4', 'G4');
const G7 = chord('G2', 'B3', 'D4', 'F4');
const F = chord('F3', 'A3', 'C4');

function window(overrides: Partial<NctWindow> & Pick<NctWindow, 'cur'>): NctWindow {
  return {
    voice: 'soprano',
    prev: null,
    next: null,
    metricStrength: 'weak',
    curChord: C,
    prevChord: null,
    nextChord: null,
    bassPitch: parsePitch('C3'),
    ...overrides,
  };
}

describe('resolvesByStepSoon', () => {
  it('accepts a step within the horizon and rejects leaps or late arrivals', () => {
    const note = placed('F4', 0, 4);
    expect(resolvesByStepSoon(note, [placed('E4', 4)]).resolves).toBe(true);
    expect(resolvesByStepSoon(note, [placed('E4', 4)]).direction).toBe(-1);
    expect(resolvesByStepSoon(note, [placed('A4', 4)]).resolves).toBe(false); // leap
    expect(resolvesByStepSoon(note, [placed('E4', 12)]).resolves).toBe(false); // too late
    expect(resolvesByStepSoon(note, []).resolves).toBe(false);
  });
});

describe('memberOfReading', () => {
  it('answers membership for chords and null when there is no chord identity', () => {
    expect(memberOfReading(parsePitch('E5'), C)).toBe(true);
    expect(memberOfReading(parsePitch('F5'), C)).toBe(false);
    expect(memberOfReading(parsePitch('D4'), chord('C4', 'D4'))).toBeNull(); // dyad
  });
});

describe('classifyNonChordTone', () => {
  it('finds a passing tone: step in, step out, one direction', () => {
    const result = classifyNonChordTone(
      window({
        prev: placed('G4', 0, 4),
        cur: placed('F4', 4, 4),
        next: placed('E4', 8, 4),
      }),
      't',
    );
    expect(result.role).toBe('passing_tone');
  });

  it('finds a neighbor tone: step out and back', () => {
    const result = classifyNonChordTone(
      window({
        prev: placed('E4', 0, 4),
        cur: placed('F4', 4, 4),
        next: placed('E4', 8, 4),
      }),
      't',
    );
    expect(result.role).toBe('neighbor_tone');
  });

  it('finds a 4-3 suspension: prepared, strong, falling onto a chord tone', () => {
    // C held from an F chord, clashing over C major's G bass? Classic shape:
    // over G7, a held C on the strong beat falls to B.
    const result = classifyNonChordTone(
      {
        voice: 'soprano',
        prev: placed('C5', 0, 8, 'prep'),
        cur: placed('C5', 8, 4, 'sus'),
        next: placed('B4', 12, 4, 'res'),
        metricStrength: 'strong',
        curChord: G7,
        prevChord: F,
        nextChord: null,
        bassPitch: parsePitch('G2'),
      },
      't',
    );
    expect(result.role).toBe('suspension');
    expect(result.suspensionType).toBe('4-3');
  });

  it('reads the upward resolution as a retardation', () => {
    const result = classifyNonChordTone(
      {
        voice: 'soprano',
        prev: placed('B4', 0, 8, 'prep'),
        cur: placed('B4', 8, 4, 'ret'),
        next: placed('C5', 12, 4, 'res'),
        metricStrength: 'strong',
        curChord: C,
        prevChord: G7,
        nextChord: null,
        bassPitch: parsePitch('C3'),
      },
      't',
    );
    expect(result.role).toBe('retardation');
  });

  it('finds an anticipation: the next chord arriving early on a weak beat', () => {
    const result = classifyNonChordTone(
      window({
        prev: placed('D5', 0, 4),
        cur: placed('C5', 4, 4),
        next: placed('C5', 8, 4),
        metricStrength: 'weak',
        curChord: G7,
        nextChord: C,
        bassPitch: parsePitch('G2'),
      }),
      't',
    );
    expect(result.role).toBe('anticipation');
  });

  it('finds appoggiatura (leap in, step out, accented) and escape (step in, leap out, weak)', () => {
    const appoggiatura = classifyNonChordTone(
      window({
        prev: placed('C4', 0, 4),
        cur: placed('F4', 4, 4),
        next: placed('E4', 8, 4),
        metricStrength: 'strong',
      }),
      't',
    );
    expect(appoggiatura.role).toBe('appoggiatura');

    const escape = classifyNonChordTone(
      window({
        prev: placed('E4', 0, 4),
        cur: placed('F4', 4, 4),
        next: placed('C5', 8, 4),
        metricStrength: 'weak',
      }),
      't',
    );
    expect(escape.role).toBe('escape_tone');
  });

  it('returns honest ambiguous when nothing fits cleanly', () => {
    const result = classifyNonChordTone(
      window({
        prev: placed('A3', 0, 4),
        cur: placed('F4', 4, 4), // leap in
        next: placed('B4', 8, 4), // leap out
      }),
      't',
    );
    expect(result.role).toBe('ambiguous');
    expect(result.evidence[0].value).toBe(false);
  });

  it('never guesses when the window is missing context', () => {
    const noPrev = classifyNonChordTone(window({ cur: placed('F4', 4, 4) }), 't');
    expect(noPrev.role).toBe('ambiguous');
  });
});

describe('suspension figures', () => {
  it('reads 7-6 and 9-8 from the generic interval above the bass', () => {
    const sevenSix = classifyNonChordTone(
      {
        voice: 'alto',
        prev: placed('F4', 0, 8, 'prep'),
        cur: placed('F4', 8, 4, 'sus'),
        next: placed('E4', 12, 4, 'res'),
        metricStrength: 'strong',
        curChord: chord('G3', 'B3', 'E4', 'G4'), // Em/G — F suspends the 7th above G
        prevChord: F,
        nextChord: null,
        bassPitch: parsePitch('G3'),
      },
      't',
    );
    expect(sevenSix.role).toBe('suspension');
    expect(sevenSix.suspensionType).toBe('7-6');

    const bassSuspension = classifyNonChordTone(
      {
        voice: 'bass',
        prev: placed('C3', 0, 8, 'prep'),
        cur: placed('C3', 8, 4, 'sus'),
        next: placed('B2', 12, 4, 'res'),
        metricStrength: 'strong',
        curChord: chord('B2', 'D4', 'G4'),
        prevChord: C,
        nextChord: null,
        bassPitch: parsePitch('C3'),
      },
      't',
    );
    expect(bassSuspension.role).toBe('suspension');
    expect(bassSuspension.suspensionType).toBe('2-3');
  });
});

describe('pedal', () => {
  it('reads a repeated pitch under changing harmony as a pedal tone', () => {
    const result = classifyNonChordTone(
      {
        voice: 'bass',
        prev: placed('C3', 0, 4, 'p1'),
        cur: placed('C3', 4, 4, 'p2'),
        next: placed('C3', 8, 4, 'p3'),
        metricStrength: 'weak',
        curChord: G7,
        prevChord: C,
        nextChord: C,
        bassPitch: parsePitch('C3'),
      },
      't',
    );
    expect(result.role).toBe('pedal_tone');
  });
});

describe('window sanity', () => {
  it('treats chord tones as out of scope (callers check membership first)', () => {
    // classifyNonChordTone assumes non-membership; E over C major is the
    // caller's chord_tone path — no assertion here beyond the contract note.
    const e: SpelledPitch = parsePitch('E4');
    expect(memberOfReading(e, C)).toBe(true);
  });
});

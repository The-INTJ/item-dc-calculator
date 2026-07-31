/**
 * The non-chord-tone classification cascade — textbook predicates over the
 * NctWindow, tried in a fixed order (suspension/retardation, passing,
 * neighbor, anticipation, appoggiatura, escape, pedal) with honest
 * 'ambiguous' when nothing fires cleanly. The melodic primitives it builds
 * on (isStep, isLeap, direction, memberOfReading) live in nct.ts.
 */

import type { MelodyRole } from '../analysis-types';
import { LETTERS } from '../pitch';
import { makeEvidence, type EngineFeatureId } from './evidence';
import {
  direction,
  isLeap,
  isStep,
  memberOfReading,
  type NctClassification,
  type NctWindow,
} from './nct';
import type { SpelledPitch } from '../music-types';

/** Generic (letter-count) interval above the bass, 1..7. */
function genericAboveBass(pitch: SpelledPitch, bass: SpelledPitch): number {
  const letterDistance =
    LETTERS.indexOf(pitch.letter) - LETTERS.indexOf(bass.letter) + 7 * (pitch.octave - bass.octave);
  return (((letterDistance % 7) + 7) % 7) + 1;
}

function suspensionFigure(w: NctWindow): '4-3' | '7-6' | '9-8' | '2-3' | 'other' {
  if (w.voice === 'bass') return '2-3';
  const generic = genericAboveBass(w.cur.pitch, w.bassPitch);
  if (generic === 4) return '4-3';
  if (generic === 7) return '7-6';
  if (generic === 2) return '9-8';
  return 'other';
}

/** A classification with its single evidence entry — every rule's shape. */
function classified(
  idSeed: string,
  role: MelodyRole,
  featureId: EngineFeatureId,
  value: boolean | string,
  explanation: string,
  suspensionType?: NctClassification['suspensionType'],
): NctClassification {
  return {
    role,
    ...(suspensionType ? { suspensionType } : {}),
    featureId,
    evidence: [makeEvidence(`${idSeed}-nct`, featureId, value, explanation)],
  };
}

/**
 * Suspension / retardation: prepared by the same pitch, which belonged to
 * the previous chord; falls (or rises) by step onto a current chord tone.
 */
function classifyPreparedNct(w: NctWindow, idSeed: string): NctClassification | null {
  const { prev, cur, next } = w;
  if (
    prev &&
    next &&
    prev.pitch.pitchClass === cur.pitch.pitchClass &&
    w.metricStrength !== 'weak' &&
    isStep(cur.pitch, next.pitch) &&
    memberOfReading(next.pitch, w.curChord) === true &&
    (w.prevChord === null || memberOfReading(prev.pitch, w.prevChord) !== false)
  ) {
    const falling = next.pitch.midi < cur.pitch.midi;
    const figure = falling ? suspensionFigure(w) : undefined;
    return classified(
      idSeed,
      falling ? 'suspension' : 'retardation',
      falling ? 'nct_suspension' : 'nct_retardation',
      figure ?? true,
      falling
        ? 'Held over from the previous chord, clashing on the strong beat, then stepping down onto a chord tone.'
        : 'Held over from the previous chord, then stepping up onto a chord tone.',
      figure,
    );
  }
  return null;
}

/** Stepwise-contour ornaments: passing tone, then neighbor tone. */
function classifyStepwiseOrnament(w: NctWindow, idSeed: string): NctClassification | null {
  const { prev, cur, next } = w;

  // Passing tone: step in, step out, same direction.
  if (
    prev &&
    next &&
    isStep(prev.pitch, cur.pitch) &&
    isStep(cur.pitch, next.pitch) &&
    direction(prev.pitch, cur.pitch) !== 0 &&
    direction(prev.pitch, cur.pitch) === direction(cur.pitch, next.pitch)
  ) {
    return classified(
      idSeed,
      'passing_tone',
      'nct_passing',
      w.metricStrength !== 'weak' ? 'accented' : 'unaccented',
      'Walks by step between two chord tones, filling the gap in one direction.',
    );
  }

  // Neighbor tone: step out and back to the same pitch.
  if (
    prev &&
    next &&
    isStep(prev.pitch, cur.pitch) &&
    isStep(cur.pitch, next.pitch) &&
    prev.pitch.pitchClass === next.pitch.pitchClass &&
    direction(prev.pitch, cur.pitch) === -direction(cur.pitch, next.pitch) &&
    direction(prev.pitch, cur.pitch) !== 0
  ) {
    return classified(
      idSeed,
      'neighbor_tone',
      'nct_neighbor',
      true,
      'Steps just off a chord tone and steps right back.',
    );
  }

  return null;
}

/** Leap-contour ornaments: appoggiatura (accented), then escape tone (weak). */
function classifyLeapOrnament(w: NctWindow, idSeed: string): NctClassification | null {
  const { prev, cur, next } = w;

  // Appoggiatura: leap in, step out, accented.
  if (
    prev &&
    next &&
    isLeap(prev.pitch, cur.pitch) &&
    isStep(cur.pitch, next.pitch) &&
    w.metricStrength !== 'weak'
  ) {
    return classified(
      idSeed,
      'appoggiatura',
      'nct_appoggiatura',
      true,
      'Leaps in, lands with a clash on the beat, then steps to its resolution — a leaning note.',
    );
  }

  // Escape tone: step in, leap out, weak.
  if (
    prev &&
    next &&
    isStep(prev.pitch, cur.pitch) &&
    isLeap(cur.pitch, next.pitch) &&
    w.metricStrength === 'weak'
  ) {
    return classified(
      idSeed,
      'escape_tone',
      'nct_escape',
      true,
      'Steps away from a chord tone and escapes by leap.',
    );
  }

  return null;
}

/**
 * Classify a non-member note. Callers check membership first — a member is a
 * chord tone and never reaches this. Returns honest 'ambiguous' when no
 * predicate fires cleanly.
 */
export function classifyNonChordTone(w: NctWindow, idSeed: string): NctClassification {
  const { prev, cur, next } = w;

  const prepared = classifyPreparedNct(w, idSeed);
  if (prepared) return prepared;

  const stepwise = classifyStepwiseOrnament(w, idSeed);
  if (stepwise) return stepwise;

  // Anticipation: the next chord's tone arriving early, on a weak position.
  // It arrives FROM a different note — a same-pitch chain is a pedal shape.
  if (
    next &&
    w.nextChord &&
    memberOfReading(cur.pitch, w.nextChord) === true &&
    cur.pitch.pitchClass === next.pitch.pitchClass &&
    (!prev || prev.pitch.pitchClass !== cur.pitch.pitchClass) &&
    w.metricStrength === 'weak'
  ) {
    return classified(
      idSeed,
      'anticipation',
      'nct_anticipation',
      true,
      'Belongs to the NEXT chord and sounds early, before the harmony arrives.',
    );
  }

  const leap = classifyLeapOrnament(w, idSeed);
  if (leap) return leap;

  // Pedal: the same pitch held/repeated while the harmony changed around it.
  if (
    prev &&
    next &&
    prev.pitch.pitchClass === cur.pitch.pitchClass &&
    next.pitch.pitchClass === cur.pitch.pitchClass &&
    w.prevChord !== null &&
    memberOfReading(prev.pitch, w.prevChord) === true
  ) {
    return classified(
      idSeed,
      'pedal_tone',
      'nct_pedal',
      true,
      'One note held while the chords change around it, clashing and re-fitting as they pass.',
    );
  }

  return classified(
    idSeed,
    'ambiguous',
    'nct_ambiguous',
    false,
    'Not a chord tone here, and no single textbook reading fits cleanly — genuinely open to interpretation.',
  );
}

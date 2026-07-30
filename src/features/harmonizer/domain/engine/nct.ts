/**
 * Non-chord-tone classification — testable predicates over the window
 * (previous note, current note, next note, metric position, current chord,
 * neighboring chords), operationalized from the textbook definitions. The
 * v1 honesty contract: passing tones, neighbor tones, and suspensions are
 * SOLID; the rarer roles are claimed only on clean evidence and everything
 * else returns 'ambiguous' — the best published classifiers cap out around
 * F1 ≈ 0.72, so honest ambiguity is correctness, not a cop-out.
 *
 * The one primitive shared with segmentation and chord-id fallbacks is
 * resolvesByStepSoon — Melisma's ornamental-dissonance rule: a sounding
 * dissonance earns its keep by moving to a step-adjacent note shortly.
 */

import type { AnalysisEvidence, MelodyRole } from '../analysis-types';
import type { SpelledPitch, VoiceId } from '../music-types';
import { UNITS_PER_BEAT, type MetricStrength } from '../timing';
import { LETTERS } from '../pitch';
import type { SonorityReading } from './chord-id';
import { makeEvidence, type EngineFeatureId } from './evidence';

export interface PlacedNote {
  pitch: SpelledPitch;
  /** 0-based unit start. */
  startUnit: number;
  units: number;
  /** Event id when the note comes from a stored event (absent for seam notes). */
  eventId?: string;
}

/** Semitone step (half or whole). Zero is not a step. */
function isStep(from: SpelledPitch, to: SpelledPitch): boolean {
  const distance = Math.abs(to.midi - from.midi);
  return distance === 1 || distance === 2;
}

function isLeap(from: SpelledPitch, to: SpelledPitch): boolean {
  return Math.abs(to.midi - from.midi) > 2;
}

function direction(from: SpelledPitch, to: SpelledPitch): -1 | 0 | 1 {
  return Math.sign(to.midi - from.midi) as -1 | 0 | 1;
}

/**
 * Does this note move to a step-adjacent note in its own voice soon (within
 * `horizonUnits` after it ends)? The ornamental-dissonance rule.
 */
export function resolvesByStepSoon(
  note: PlacedNote,
  laterInVoice: PlacedNote[],
  horizonUnits: number = UNITS_PER_BEAT,
): { resolves: boolean; direction: -1 | 0 | 1 } {
  const noteEnd = note.startUnit + note.units;
  const next = laterInVoice
    .filter((candidate) => candidate.startUnit >= noteEnd)
    .sort((a, b) => a.startUnit - b.startUnit)[0];
  if (!next || next.startUnit > noteEnd + horizonUnits) {
    return { resolves: false, direction: 0 };
  }
  if (!isStep(note.pitch, next.pitch)) return { resolves: false, direction: 0 };
  return { resolves: true, direction: direction(note.pitch, next.pitch) };
}

/** Is a pitch class a tone of the reading? Null when the reading names no chord. */
export function memberOfReading(pitch: SpelledPitch, reading: SonorityReading): boolean | null {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.tones.some((tone) => tone.pitchClass === pitch.pitchClass);
    case 'monad':
      return reading.tone.pitchClass === pitch.pitchClass;
    case 'dyad':
    case 'unknown':
      return null; // no chord identity to be a non-member of
  }
}

export interface NctWindow {
  voice: VoiceId;
  /** May come from the approach seam — the note this voice arrives from. */
  prev: PlacedNote | null;
  cur: PlacedNote;
  next: PlacedNote | null;
  metricStrength: MetricStrength;
  curChord: SonorityReading;
  prevChord: SonorityReading | null;
  nextChord: SonorityReading | null;
  /** The sounding bass under the current note — suspension figures need it. */
  bassPitch: SpelledPitch;
}

export interface NctClassification {
  role: MelodyRole;
  suspensionType?: '4-3' | '7-6' | '9-8' | '2-3' | 'other';
  featureId: EngineFeatureId;
  /** Evidence prose fragments; the composer turns these into sentences. */
  evidence: AnalysisEvidence[];
}

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

/**
 * Classify a non-member note. Callers check membership first — a member is a
 * chord tone and never reaches this. Returns honest 'ambiguous' when no
 * predicate fires cleanly.
 */
export function classifyNonChordTone(w: NctWindow, idSeed: string): NctClassification {
  const { prev, cur, next } = w;

  // Suspension / retardation: prepared by the same pitch, which belonged to
  // the previous chord; falls (or rises) by step onto a current chord tone.
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
    const role: MelodyRole = falling ? 'suspension' : 'retardation';
    const figure = falling ? suspensionFigure(w) : undefined;
    return {
      role,
      ...(figure ? { suspensionType: figure } : {}),
      featureId: falling ? 'nct_suspension' : 'nct_retardation',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          falling ? 'nct_suspension' : 'nct_retardation',
          figure ?? true,
          falling
            ? 'Held over from the previous chord, clashing on the strong beat, then stepping down onto a chord tone.'
            : 'Held over from the previous chord, then stepping up onto a chord tone.',
        ),
      ],
    };
  }

  // Passing tone: step in, step out, same direction.
  if (
    prev &&
    next &&
    isStep(prev.pitch, cur.pitch) &&
    isStep(cur.pitch, next.pitch) &&
    direction(prev.pitch, cur.pitch) !== 0 &&
    direction(prev.pitch, cur.pitch) === direction(cur.pitch, next.pitch)
  ) {
    return {
      role: 'passing_tone',
      featureId: 'nct_passing',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_passing',
          w.metricStrength !== 'weak' ? 'accented' : 'unaccented',
          'Walks by step between two chord tones, filling the gap in one direction.',
        ),
      ],
    };
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
    return {
      role: 'neighbor_tone',
      featureId: 'nct_neighbor',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_neighbor',
          true,
          'Steps just off a chord tone and steps right back.',
        ),
      ],
    };
  }

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
    return {
      role: 'anticipation',
      featureId: 'nct_anticipation',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_anticipation',
          true,
          'Belongs to the NEXT chord and sounds early, before the harmony arrives.',
        ),
      ],
    };
  }

  // Appoggiatura: leap in, step out, accented.
  if (
    prev &&
    next &&
    isLeap(prev.pitch, cur.pitch) &&
    isStep(cur.pitch, next.pitch) &&
    w.metricStrength !== 'weak'
  ) {
    return {
      role: 'appoggiatura',
      featureId: 'nct_appoggiatura',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_appoggiatura',
          true,
          'Leaps in, lands with a clash on the beat, then steps to its resolution — a leaning note.',
        ),
      ],
    };
  }

  // Escape tone: step in, leap out, weak.
  if (
    prev &&
    next &&
    isStep(prev.pitch, cur.pitch) &&
    isLeap(cur.pitch, next.pitch) &&
    w.metricStrength === 'weak'
  ) {
    return {
      role: 'escape_tone',
      featureId: 'nct_escape',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_escape',
          true,
          'Steps away from a chord tone and escapes by leap.',
        ),
      ],
    };
  }

  // Pedal: the same pitch held/repeated while the harmony changed around it.
  if (
    prev &&
    next &&
    prev.pitch.pitchClass === cur.pitch.pitchClass &&
    next.pitch.pitchClass === cur.pitch.pitchClass &&
    w.prevChord !== null &&
    memberOfReading(prev.pitch, w.prevChord) === true
  ) {
    return {
      role: 'pedal_tone',
      featureId: 'nct_pedal',
      evidence: [
        makeEvidence(
          `${idSeed}-nct`,
          'nct_pedal',
          true,
          'One note held while the chords change around it, clashing and re-fitting as they pass.',
        ),
      ],
    };
  }

  return {
    role: 'ambiguous',
    featureId: 'nct_ambiguous',
    evidence: [
      makeEvidence(
        `${idSeed}-nct`,
        'nct_ambiguous',
        false,
        'Not a chord tone here, and no single textbook reading fits cleanly — genuinely open to interpretation.',
      ),
    ],
  };
}

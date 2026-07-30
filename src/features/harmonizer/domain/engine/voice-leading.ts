/**
 * Voice-leading FACTS — pure observations over an SATB surface. This module
 * never judges: parallels and open fifths are legitimate style in the
 * shape-note tradition this app serves, so severity (including "ignore
 * entirely") comes exclusively from a style pack. The math only reports what
 * happened and where.
 */

import type { SpelledPitch, TonalContext, VoiceId } from '../music-types';
import type { EngineFeatureId } from './evidence';
import { memberOfReading } from './nct';
import type { AnalyzedSegment, PlacedVoiceNote } from './segmentation';

export type VoiceLeadingFactId = Extract<
  EngineFeatureId,
  | 'parallel_perfect_fifths'
  | 'parallel_octaves'
  | 'hidden_fifth_outer'
  | 'hidden_octave_outer'
  | 'voice_crossing'
  | 'voice_overlap'
  | 'spacing_sa_exceeded'
  | 'spacing_at_exceeded'
  | 'range_outer_warning'
  | 'range_exceeded'
  | 'doubled_leading_tone'
  | 'leading_tone_unresolved'
  | 'seventh_unresolved'
>;

export interface VoiceLeadingFact {
  id: VoiceLeadingFactId;
  voices: VoiceId[];
  /** 0-based unit where the observation lands. */
  atUnit: number;
  detail: string;
}

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];
const VOICE_LABEL: Record<VoiceId, string> = {
  soprano: 'soprano',
  alto: 'alto',
  tenor: 'tenor',
  bass: 'bass',
};

/** Hymnal-practical ranges (midi): comfortable congregational envelopes. */
const RANGES: Record<VoiceId, { low: number; high: number }> = {
  soprano: { low: 60, high: 79 }, // C4–G5
  alto: { low: 55, high: 74 }, // G3–D5
  tenor: { low: 48, high: 67 }, // C3–G4
  bass: { low: 40, high: 60 }, // E2–C4
};

type VoiceState = Partial<Record<VoiceId, PlacedVoiceNote>>;

/** The note sounding in each voice at a unit. */
function stateAt(lines: Record<VoiceId, PlacedVoiceNote[]>, unit: number): VoiceState {
  const state: VoiceState = {};
  for (const voice of VOICES) {
    const note = lines[voice].find(
      (candidate) => candidate.startUnit <= unit && unit < candidate.startUnit + candidate.units,
    );
    if (note) state[voice] = note;
  }
  return state;
}

function simpleIntervalClass(a: SpelledPitch, b: SpelledPitch): number {
  return Math.abs(a.midi - b.midi) % 12;
}

/** All state boundaries — the starts of every note. */
function boundaries(lines: Record<VoiceId, PlacedVoiceNote[]>): number[] {
  return [...new Set(VOICES.flatMap((voice) => lines[voice].map((note) => note.startUnit)))].sort(
    (a, b) => a - b,
  );
}

function pairFacts(atUnit: number, from: VoiceState, to: VoiceState): VoiceLeadingFact[] {
  const facts: VoiceLeadingFact[] = [];
  for (let i = 0; i < VOICES.length; i += 1) {
    for (let j = i + 1; j < VOICES.length; j += 1) {
      const [upper, lower] = [VOICES[i], VOICES[j]];
      const a1 = from[upper];
      const b1 = from[lower];
      const a2 = to[upper];
      const b2 = to[lower];
      if (!a1 || !b1 || !a2 || !b2) continue;
      const bothMoved = a1.pitch.midi !== a2.pitch.midi && b1.pitch.midi !== b2.pitch.midi;
      if (!bothMoved) continue;
      const i1 = simpleIntervalClass(a1.pitch, b1.pitch);
      const i2 = simpleIntervalClass(a2.pitch, b2.pitch);
      if (i1 === i2 && (i1 === 7 || i1 === 0)) {
        facts.push({
          id: i1 === 7 ? 'parallel_perfect_fifths' : 'parallel_octaves',
          voices: [upper, lower],
          atUnit,
          detail: `${VOICE_LABEL[upper]} and ${VOICE_LABEL[lower]} move in parallel ${i1 === 7 ? 'fifths' : 'octaves'}`,
        });
      }
    }
  }
  // Hidden/direct perfects: outer voices only, similar motion, soprano leaps.
  const s1 = from.soprano;
  const b1 = from.bass;
  const s2 = to.soprano;
  const b2 = to.bass;
  if (s1 && b1 && s2 && b2) {
    const sopranoMotion = Math.sign(s2.pitch.midi - s1.pitch.midi);
    const bassMotion = Math.sign(b2.pitch.midi - b1.pitch.midi);
    const arrival = simpleIntervalClass(s2.pitch, b2.pitch);
    const wasAlready = simpleIntervalClass(s1.pitch, b1.pitch) === arrival;
    const sopranoLeaps = Math.abs(s2.pitch.midi - s1.pitch.midi) > 2;
    if (
      sopranoMotion !== 0 &&
      sopranoMotion === bassMotion &&
      (arrival === 7 || arrival === 0) &&
      !wasAlready &&
      sopranoLeaps
    ) {
      facts.push({
        id: arrival === 7 ? 'hidden_fifth_outer' : 'hidden_octave_outer',
        voices: ['soprano', 'bass'],
        atUnit,
        detail: `outer voices land on a ${arrival === 7 ? 'fifth' : 'octave'} in similar motion with a soprano leap`,
      });
    }
  }
  // Overlap: a voice moves past where its neighbor just was.
  for (let i = 0; i < VOICES.length - 1; i += 1) {
    const upper = VOICES[i];
    const lower = VOICES[i + 1];
    const u1 = from[upper];
    const l1 = from[lower];
    const u2 = to[upper];
    const l2 = to[lower];
    if (u1 && l2 && l2.pitch.midi > u1.pitch.midi && l1 && l1.pitch.midi !== l2.pitch.midi) {
      facts.push({
        id: 'voice_overlap',
        voices: [upper, lower],
        atUnit,
        detail: `${VOICE_LABEL[lower]} moves above where the ${VOICE_LABEL[upper]} just sang`,
      });
    } else if (l1 && u2 && u2.pitch.midi < l1.pitch.midi && u1 && u1.pitch.midi !== u2.pitch.midi) {
      facts.push({
        id: 'voice_overlap',
        voices: [upper, lower],
        atUnit,
        detail: `${VOICE_LABEL[upper]} moves below where the ${VOICE_LABEL[lower]} just sang`,
      });
    }
  }
  return facts;
}

function stateFacts(atUnit: number, state: VoiceState, context: TonalContext): VoiceLeadingFact[] {
  const facts: VoiceLeadingFact[] = [];
  // Crossing within the chord.
  for (let i = 0; i < VOICES.length - 1; i += 1) {
    const upper = state[VOICES[i]];
    const lower = state[VOICES[i + 1]];
    if (upper && lower && upper.pitch.midi < lower.pitch.midi) {
      facts.push({
        id: 'voice_crossing',
        voices: [VOICES[i], VOICES[i + 1]],
        atUnit,
        detail: `${VOICE_LABEL[VOICES[i]]} sounds below the ${VOICE_LABEL[VOICES[i + 1]]}`,
      });
    }
  }
  // Spacing: S–A and A–T within an octave.
  if (state.soprano && state.alto && state.soprano.pitch.midi - state.alto.pitch.midi > 12) {
    facts.push({
      id: 'spacing_sa_exceeded',
      voices: ['soprano', 'alto'],
      atUnit,
      detail: 'more than an octave between soprano and alto',
    });
  }
  if (state.alto && state.tenor && state.alto.pitch.midi - state.tenor.pitch.midi > 12) {
    facts.push({
      id: 'spacing_at_exceeded',
      voices: ['alto', 'tenor'],
      atUnit,
      detail: 'more than an octave between alto and tenor',
    });
  }
  // Ranges: soft outer-whole-step warning, then exceeded.
  for (const voice of VOICES) {
    const note = state[voice];
    if (!note) continue;
    const range = RANGES[voice];
    if (note.pitch.midi < range.low - 2 || note.pitch.midi > range.high + 2) {
      facts.push({
        id: 'range_exceeded',
        voices: [voice],
        atUnit,
        detail: `${VOICE_LABEL[voice]} sits outside the comfortable congregational range`,
      });
    } else if (note.pitch.midi < range.low || note.pitch.midi > range.high) {
      facts.push({
        id: 'range_outer_warning',
        voices: [voice],
        atUnit,
        detail: `${VOICE_LABEL[voice]} is at the edge of the comfortable congregational range`,
      });
    }
  }
  // Doubled leading tone (ti in major; the raised si in la-based minor is the
  // same half-step-below-tonic pitch class).
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  const holders = VOICES.filter((voice) => state[voice]?.pitch.pitchClass === leadingPc);
  if (holders.length >= 2) {
    facts.push({
      id: 'doubled_leading_tone',
      voices: holders,
      atUnit,
      detail: 'two voices double the leading tone',
    });
  }
  return facts;
}

/** Tendency-tone facts need chord context — the segments carry the readings. */
function tendencyFacts(
  lines: Record<VoiceId, PlacedVoiceNote[]>,
  segments: AnalyzedSegment[],
  context: TonalContext,
): VoiceLeadingFact[] {
  const facts: VoiceLeadingFact[] = [];
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  const tonicPc = context.tonicPitchClass;

  for (let s = 0; s < segments.length - 1; s += 1) {
    const segment = segments[s];
    const next = segments[s + 1];
    const reading = segment.reading;
    if (reading.kind !== 'exact' && reading.kind !== 'subset') continue;
    const nextReading = next.reading;
    const nextIsTonic =
      (nextReading.kind === 'exact' ||
        nextReading.kind === 'subset' ||
        nextReading.kind === 'open_fifth' ||
        nextReading.kind === 'incomplete_triad') &&
      nextReading.root.pitchClass === tonicPc;
    const boundary = next.start;

    for (const voice of VOICES) {
      const note = lines[voice].find(
        (candidate) =>
          candidate.startUnit < boundary && boundary <= candidate.startUnit + candidate.units,
      );
      const following = lines[voice].find((candidate) => candidate.startUnit === boundary);
      if (!note || !following) continue;

      // Leading tone into a tonic chord: outer voices resolve up a half step.
      if (
        note.pitch.pitchClass === leadingPc &&
        memberOfReading(note.pitch, reading) === true &&
        nextIsTonic &&
        (voice === 'soprano' || voice === 'bass') &&
        following.pitch.midi - note.pitch.midi !== 1
      ) {
        facts.push({
          id: 'leading_tone_unresolved',
          voices: [voice],
          atUnit: boundary,
          detail: `${VOICE_LABEL[voice]} leaves the leading tone without rising to the tonic`,
        });
      }

      // A chordal seventh resolves down by step, whatever comes next.
      if (reading.template.intervals.length === 4) {
        const seventhPc =
          (reading.root.pitchClass + reading.template.intervals[3]) % 12;
        if (
          note.pitch.pitchClass === seventhPc &&
          !(following.pitch.midi < note.pitch.midi && note.pitch.midi - following.pitch.midi <= 2)
        ) {
          facts.push({
            id: 'seventh_unresolved',
            voices: [voice],
            atUnit: boundary,
            detail: `${VOICE_LABEL[voice]} leaves the chordal seventh without stepping down`,
          });
        }
      }
    }
  }
  return facts;
}

/**
 * Every voice-leading observation on the surface, in timeline order.
 * Facts only — severities live in style packs.
 */
export function checkVoiceLeading(
  lines: Record<VoiceId, PlacedVoiceNote[]>,
  segments: AnalyzedSegment[],
  context: TonalContext,
): VoiceLeadingFact[] {
  const facts: VoiceLeadingFact[] = [];
  const starts = boundaries(lines);
  let previous: VoiceState | null = null;
  for (const unit of starts) {
    const state = stateAt(lines, unit);
    facts.push(...stateFacts(unit, state, context));
    if (previous) facts.push(...pairFacts(unit, previous, state));
    previous = state;
  }
  facts.push(...tendencyFacts(lines, segments, context));
  facts.sort((a, b) => a.atUnit - b.atUnit || a.id.localeCompare(b.id));
  return facts;
}

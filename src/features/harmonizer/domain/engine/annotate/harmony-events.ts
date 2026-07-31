/**
 * Harmony events from analyzed segments — projects each segment's sonority
 * reading into a chord (tones, root, quality), reads it in the key, and
 * applies the one sequence-aware refinement owned here: the cadential 6/4,
 * which re-tags a strong-beat tonic 6/4 moving to V as dominant function.
 */

import type { AnalysisEvidence } from '../../analysis-types';
import type { HarmonyEvent, SpelledPitchClass, TonalContext } from '../../music-types';
// metricStrengthAt: cadential six-four gating reads the 4/4 accent map — see
// the meter ledger in domain/timing.ts.
import { metricStrengthAt, unitsToDuration, unitsToTime } from '../../timing';
import type { SonorityReading } from '../chord-id';
import { makeEvidence } from '../evidence';
import { analyzeInKey } from '../roman';
import type { AnalyzedSegment } from '../segmentation';

/** The chord tones a reading asserts; sounding tones when it asserts none. */
function chordTonesOf(reading: SonorityReading, segment: AnalyzedSegment): SpelledPitchClass[] {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.tones;
    case 'monad':
      return [reading.tone];
    case 'dyad':
    case 'unknown':
      return reading.tones.length > 0
        ? reading.tones
        : segment.pitches.map((pitch) => ({
            letter: pitch.letter,
            accidental: pitch.accidental,
            pitchClass: pitch.pitchClass,
          }));
  }
}

function chordQualityOf(reading: SonorityReading): HarmonyEvent['chord']['quality'] {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
      return reading.quality;
    default:
      return 'other';
  }
}

function chordRootOf(reading: SonorityReading, segment: AnalyzedSegment): SpelledPitchClass {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.root;
    case 'monad':
      return reading.tone;
    default:
      return {
        letter: segment.bassPitch.letter,
        accidental: segment.bassPitch.accidental,
        pitchClass: segment.bassPitch.pitchClass,
      };
  }
}

/** True when the reading's root is this pitch class and it names a chord. */
function rootedAt(reading: SonorityReading, pc: number): boolean {
  return (
    (reading.kind === 'exact' ||
      reading.kind === 'subset' ||
      reading.kind === 'incomplete_triad' ||
      reading.kind === 'open_fifth') &&
    reading.root.pitchClass === pc
  );
}

/** Harmony events for the segments, pushing cadence evidence as it goes. */
export function buildHarmonyEvents(
  segments: AnalyzedSegment[],
  context: TonalContext,
  idPrefix: string,
  evidence: AnalysisEvidence[],
): HarmonyEvent[] {
  const dominantPc = (context.tonicPitchClass + 7) % 12;
  return segments.map((segment, index) => {
    const key = analyzeInKey(context, segment.reading, segment.bassPitch);
    let analysis = key.analysis;
    const nextSegment = segments[index + 1];
    const isCadentialSixFour =
      key.inversion === 2 &&
      (segment.reading.kind === 'exact' || segment.reading.kind === 'subset') &&
      segment.reading.template.intervals.length === 3 &&
      segment.reading.root.pitchClass === context.tonicPitchClass &&
      nextSegment !== undefined &&
      rootedAt(nextSegment.reading, dominantPc) &&
      metricStrengthAt(segment.start) !== 'weak';
    if (isCadentialSixFour) {
      analysis = { ...analysis, functionTags: ['dominant'] };
      evidence.push(
        makeEvidence(
          `${idPrefix}-cad64-${index}`,
          'cadence_reading',
          'cadential_six_four',
          'A tonic chord over the dominant bass on a strong beat, moving to V — it behaves as part of the dominant, not as a tonic arrival.',
        ),
      );
    }
    const tones = chordTonesOf(segment.reading, segment);
    return {
      id: `${idPrefix}-dh${index}`,
      start: unitsToTime(segment.start),
      duration: unitsToDuration(segment.units),
      chord: {
        id: `${idPrefix}-son${index}`,
        root: chordRootOf(segment.reading, segment),
        pitchClasses: tones.map((tone) => tone.pitchClass),
        spelledChordTones: tones,
        quality: chordQualityOf(segment.reading),
      },
      analysis,
      inversion: key.inversion,
      bassPitch: segment.bassPitch,
      displaySymbol: key.displaySymbol,
      ...(segment.suspensionFigure
        ? { figuredBass: segment.suspensionFigure }
        : key.figuredBass !== undefined
          ? { figuredBass: key.figuredBass }
          : {}),
    };
  });
}

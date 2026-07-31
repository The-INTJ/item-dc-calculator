/* ---------------- vocabulary ---------------- */

import type { ChordQuality, DiatonicDegree, TonalContext } from '../../music-types';
import type { VocabChord } from '../style';

export interface DegreeMemberRef {
  degree: DiatonicDegree;
  chromaticOffset: number;
}

export interface EnumeratedChord {
  /** Stable key for ids and diversity comparison, e.g. "d5", "d5x7", "d5raised". */
  key: string;
  rootDegree: DiatonicDegree;
  romanNumeral: string;
  quality: ChordQuality;
  pitchClasses: number[];
  members: DegreeMemberRef[];
}

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

function wrapDegree(value: number): DiatonicDegree {
  return ((((value - 1) % 7) + 7) % 7 + 1) as DiatonicDegree;
}

function modeIntervals(context: TonalContext): number[] | null {
  if (context.mode === 'major') return [0, 2, 4, 5, 7, 9, 11];
  if (context.mode === 'natural_minor' && context.minorDoSystem === 'la_based') {
    return [0, 2, 3, 5, 7, 8, 10];
  }
  return null;
}

function triadQuality(third: number, fifth: number): ChordQuality {
  if (third === 4 && fifth === 7) return 'major';
  if (third === 3 && fifth === 7) return 'minor';
  if (third === 3 && fifth === 6) return 'diminished';
  if (third === 4 && fifth === 8) return 'augmented';
  return 'other';
}

function numeralFor(degree: DiatonicDegree, quality: ChordQuality): string {
  const base = DEGREE_NUMERALS[degree - 1];
  if (quality === 'major' || quality === 'augmented' || quality === 'dominant_seventh') {
    return base;
  }
  const lower = base.toLowerCase();
  return quality === 'diminished' ? `${lower}°` : lower;
}

/**
 * The generation vocabulary: the seven diatonic triads, plus V7 in major, and
 * in la-based minor BOTH the modal minor v (already diatonic) and the
 * conventionally raised major V and V7 — labeled alternatives, per the
 * tradition. Null for unsupported contexts.
 */
export function enumerateChords(context: TonalContext): EnumeratedChord[] | null {
  const intervals = modeIntervals(context);
  if (!intervals) return null;
  const pcOf = (degree: DiatonicDegree, offset = 0) =>
    (((context.tonicPitchClass + intervals[degree - 1] + offset) % 12) + 12) % 12;

  const chords: EnumeratedChord[] = [];
  for (let d = 1 as DiatonicDegree; d <= 7; d = (d + 1) as DiatonicDegree) {
    const members: DegreeMemberRef[] = [d, wrapDegree(d + 2), wrapDegree(d + 4)].map((degree) => ({
      degree,
      chromaticOffset: 0,
    }));
    const pcs = members.map((member) => pcOf(member.degree));
    const third = (pcs[1] - pcs[0] + 12) % 12;
    const fifth = (pcs[2] - pcs[0] + 12) % 12;
    const quality = triadQuality(third, fifth);
    chords.push({
      key: `d${d}`,
      rootDegree: d,
      romanNumeral: numeralFor(d, quality),
      quality,
      pitchClasses: pcs,
      members,
    });
  }

  if (context.mode === 'major') {
    const members: DegreeMemberRef[] = [5, 7, 2, 4].map((value) => ({
      degree: wrapDegree(value),
      chromaticOffset: 0,
    }));
    chords.push({
      key: 'd5x7',
      rootDegree: 5,
      romanNumeral: 'V7',
      quality: 'dominant_seventh',
      pitchClasses: members.map((member) => pcOf(member.degree)),
      members,
    });
  } else {
    const raisedTriad: DegreeMemberRef[] = [
      { degree: 5, chromaticOffset: 0 },
      { degree: 7, chromaticOffset: 1 },
      { degree: 2, chromaticOffset: 0 },
    ];
    chords.push({
      key: 'd5raised',
      rootDegree: 5,
      romanNumeral: 'V',
      quality: 'major',
      pitchClasses: raisedTriad.map((member) => pcOf(member.degree, member.chromaticOffset)),
      members: raisedTriad,
    });
    const raisedSeventhChord: DegreeMemberRef[] = [
      { degree: 5, chromaticOffset: 0 },
      { degree: 7, chromaticOffset: 1 },
      { degree: 2, chromaticOffset: 0 },
      { degree: 4, chromaticOffset: 0 },
    ];
    chords.push({
      key: 'd5x7raised',
      rootDegree: 5,
      romanNumeral: 'V7',
      quality: 'dominant_seventh',
      pitchClasses: raisedSeventhChord.map((member) => pcOf(member.degree, member.chromaticOffset)),
      members: raisedSeventhChord,
    });
  }
  return chords;
}

export function toVocabChord(chord: EnumeratedChord, context: TonalContext): VocabChord {
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  return {
    key: chord.key,
    rootDegree: chord.rootDegree,
    raisedLeadingTone: chord.members.some(
      (member) => member.degree === 7 && member.chromaticOffset === 1,
    ),
    isSeventh: chord.members.length === 4,
    containsLeadingTone: chord.pitchClasses.includes(leadingPc),
  };
}

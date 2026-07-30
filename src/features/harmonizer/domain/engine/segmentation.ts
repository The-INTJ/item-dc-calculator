/**
 * Harmonic segmentation of an SATB surface: salami-slice at the union of all
 * voice boundaries, merge identical sonorities (the POC behavior), then a
 * second pass merges a WEAK slice into its preceding chord when every note it
 * adds is explainable as ornamental — a passing sixteenth in the alto should
 * not read as a new chord. The merge test is resolvesByStepSoon; boundaries
 * on strong/medium beats are always respected. Homorhythmic hymns need no DP;
 * a cost lattice is the documented upgrade path if textures ever thicken.
 */

import type { SATBVoicing, SpelledPitch, VoiceId } from '../music-types';
// metricStrengthAt: ornamental-continuation merging fires only on weak slices
// of the 4/4 accent map — see the meter ledger in domain/timing.ts.
import { metricStrengthAt, toTimelineSpan } from '../timing';
import { SONORITY_TEMPLATES, identifySonority, type SonorityReading } from './chord-id';
import { memberOfReading, resolvesByStepSoon, type PlacedNote } from './nct';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

export interface PlacedVoiceNote extends PlacedNote {
  voice: VoiceId;
}

interface Slice {
  start: number;
  units: number;
  /** All sounding pitches, lowest first (duplicates by midi collapsed). */
  pitches: SpelledPitch[];
  pcs: number[];
  /** The sounding notes with their voices — NCT explanations need the lines. */
  notes: PlacedVoiceNote[];
}

export interface AnalyzedSegment {
  /** 0-based unit start of the (possibly merged) harmonic span. */
  start: number;
  units: number;
  /** The reading of the segment's ANCHOR sonority (ornamental notes excluded). */
  reading: SonorityReading;
  /** Lowest sounding pitch at the anchor — the bass the analysis reads from. */
  bassPitch: SpelledPitch;
  /** Every distinct sounding pitch across the span, lowest first. */
  pitches: SpelledPitch[];
  /** Sounding notes across the span that are NOT tones of the reading. */
  ornamental: PlacedVoiceNote[];
  /** Present when a sus sonority was re-read as a suspension over the triad. */
  suspensionFigure?: '4-3';
}

/** Per-voice note lines, 0-based units, sorted by start. */
export function placedVoiceLines(voicing: SATBVoicing): Record<VoiceId, PlacedVoiceNote[]> {
  const lines = { soprano: [], alto: [], tenor: [], bass: [] } as Record<VoiceId, PlacedVoiceNote[]>;
  for (const voice of VOICES) {
    lines[voice] = voicing[voice]
      .map((event) => {
        const span = toTimelineSpan(event.start, event.duration);
        return {
          voice,
          pitch: event.pitch,
          startUnit: span.startUnit - 1,
          units: span.spanUnits,
          eventId: event.id,
        };
      })
      .sort((a, b) => a.startUnit - b.startUnit);
  }
  return lines;
}

function slicesOf(lines: Record<VoiceId, PlacedVoiceNote[]>): Slice[] {
  const placed = VOICES.flatMap((voice) => lines[voice]);
  if (placed.length === 0) return [];
  const boundaries = [
    ...new Set(placed.flatMap((note) => [note.startUnit, note.startUnit + note.units])),
  ].sort((a, b) => a - b);

  const slices: Slice[] = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    const sounding = placed.filter(
      (note) => note.startUnit < end && start < note.startUnit + note.units,
    );
    if (sounding.length === 0) continue;
    const pitches: SpelledPitch[] = [];
    for (const note of [...sounding].sort((a, b) => a.pitch.midi - b.pitch.midi)) {
      if (!pitches.some((pitch) => pitch.midi === note.pitch.midi)) pitches.push(note.pitch);
    }
    const pcs: number[] = [];
    for (const pitch of pitches) {
      if (!pcs.includes(pitch.pitchClass)) pcs.push(pitch.pitchClass);
    }
    const previous = slices[slices.length - 1];
    if (
      previous &&
      previous.start + previous.units === start &&
      previous.pcs.length === pcs.length &&
      previous.pcs.every((pc, index) => pcs[index] === pc)
    ) {
      previous.units += end - start; // same sonority continuing — one segment
      previous.notes = [...new Set([...previous.notes, ...sounding])];
    } else {
      slices.push({ start, units: end - start, pitches, pcs, notes: sounding });
    }
  }
  return slices;
}

/** True when every note the slice adds beyond the reading resolves by step soon. */
function explainableAgainst(
  slice: Slice,
  reading: SonorityReading,
  lines: Record<VoiceId, PlacedVoiceNote[]>,
): boolean {
  const extras = slice.notes.filter((note) => memberOfReading(note.pitch, reading) === false);
  if (extras.length === 0) return true;
  return extras.every(
    (note) => resolvesByStepSoon(note, lines[note.voice]).resolves,
  );
}

/**
 * The suspension re-read: a sus4 sonority whose fourth is PREPARED (the same
 * pitch sounding into the segment, or the previous note in that voice) and
 * RESOLVES down by step onto the triad's third is heard as the plain triad
 * with a 4–3 suspension — the classic cadential figure. Unprepared or
 * unresolved sus chords stay exactly what they sound like.
 */
function upgradeSuspensions(
  segments: AnalyzedSegment[],
  lines: Record<VoiceId, PlacedVoiceNote[]>,
  seamPitchClasses: Partial<Record<VoiceId, number>>,
): void {
  segments.forEach((segment, index) => {
    const reading = segment.reading;
    if (reading.kind !== 'exact' || reading.quality !== 'suspended_fourth') return;
    const fourthPc = (reading.root.pitchClass + 5) % 12;
    const segmentEnd = segment.start + segment.units;

    for (const voice of VOICES) {
      const note = lines[voice].find(
        (candidate) =>
          candidate.pitch.pitchClass === fourthPc &&
          candidate.startUnit < segmentEnd &&
          segment.start < candidate.startUnit + candidate.units,
      );
      if (!note) continue;
      // Preparation: the note began before this segment (a sustained tie), the
      // previous note in the voice carried the same pitch class, or — for an
      // opening segment — the voice arrived from that pitch across the seam.
      const noteIndex = lines[voice].indexOf(note);
      const prepared =
        note.startUnit < segment.start ||
        lines[voice][noteIndex - 1]?.pitch.pitchClass === fourthPc ||
        (index === 0 && seamPitchClasses[voice] === fourthPc);
      if (!prepared) continue;
      // Resolution: the next note in the voice steps down onto the third.
      const following = lines[voice][noteIndex + 1];
      if (!following) continue;
      const drop = note.pitch.midi - following.pitch.midi;
      if (drop !== 1 && drop !== 2) continue;
      const thirdInterval = (following.pitch.pitchClass - reading.root.pitchClass + 12) % 12;
      if (thirdInterval !== 3 && thirdInterval !== 4) continue;

      const quality = thirdInterval === 4 ? ('major' as const) : ('minor' as const);
      const template = SONORITY_TEMPLATES.find((entry) => entry.quality === quality);
      if (!template) return;
      const fifth = reading.tones.find(
        (tone) => (tone.pitchClass - reading.root.pitchClass + 12) % 12 === 7,
      );
      const third = {
        letter: following.pitch.letter,
        accidental: following.pitch.accidental,
        pitchClass: following.pitch.pitchClass,
      };
      segments[index] = {
        ...segment,
        reading: {
          kind: 'subset',
          root: reading.root,
          quality,
          template,
          tones: fifth ? [reading.root, third, fifth] : [reading.root, third],
          leftovers: [{ pitch: note.pitch }],
        },
        ornamental: [...segment.ornamental, note],
        suspensionFigure: '4-3',
      };
      return;
    }
  });
}

/**
 * Segment a surface into harmonic spans with named readings. Weak slices
 * whose extra notes are ornamental merge into the preceding chord; their
 * non-member notes surface in `ornamental` for the classifier. Sus-fourth
 * sonorities with preparation and resolution re-read as 4–3 suspensions;
 * `seamPitchClasses` lets an opening segment count the previous piece's
 * final notes as preparation.
 */
export function segmentSurface(
  voicing: SATBVoicing,
  seamPitchClasses: Partial<Record<VoiceId, number>> = {},
): AnalyzedSegment[] {
  const lines = placedVoiceLines(voicing);
  const slices = slicesOf(lines);

  const segments: AnalyzedSegment[] = [];
  for (const slice of slices) {
    const bass = slice.pitches[0];
    const previous = segments[segments.length - 1];
    if (
      previous &&
      previous.start + previous.units === slice.start &&
      metricStrengthAt(slice.start) === 'weak' &&
      (previous.reading.kind === 'exact' ||
        previous.reading.kind === 'subset' ||
        previous.reading.kind === 'incomplete_triad' ||
        previous.reading.kind === 'open_fifth') &&
      explainableAgainst(slice, previous.reading, lines)
    ) {
      // Ornamental continuation — extend the chord over the moving notes.
      previous.units += slice.units;
      for (const pitch of slice.pitches) {
        if (!previous.pitches.some((existing) => existing.midi === pitch.midi)) {
          previous.pitches.push(pitch);
        }
      }
      previous.pitches.sort((a, b) => a.midi - b.midi);
      for (const note of slice.notes) {
        if (
          memberOfReading(note.pitch, previous.reading) === false &&
          !previous.ornamental.some(
            (existing) => existing.eventId === note.eventId && existing.startUnit === note.startUnit,
          )
        ) {
          previous.ornamental.push(note);
        }
      }
      continue;
    }
    const reading = identifySonority({ pitches: slice.pitches, bassPc: bass.pitchClass });
    const ornamental =
      reading.kind === 'subset'
        ? slice.notes.filter((note) => memberOfReading(note.pitch, reading) === false)
        : [];
    segments.push({
      start: slice.start,
      units: slice.units,
      reading,
      bassPitch: bass,
      pitches: [...slice.pitches],
      ornamental,
    });
  }
  upgradeSuspensions(segments, lines, seamPitchClasses);
  return segments;
}

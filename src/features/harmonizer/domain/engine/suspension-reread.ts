/**
 * The suspension re-read: a sus4 sonority whose fourth is PREPARED (the same
 * pitch sounding into the segment, or the previous note in that voice) and
 * RESOLVES down by step onto the triad's third is heard as the plain triad
 * with a 4–3 suspension — the classic cadential figure. Unprepared or
 * unresolved sus chords stay exactly what they sound like.
 */

import type { VoiceId } from '../music-types';
import { SONORITY_TEMPLATES } from './chord-id';
import type { AnalyzedSegment, PlacedVoiceNote } from './segmentation';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

export function upgradeSuspensions(
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

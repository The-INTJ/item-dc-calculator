/**
 * Tendency-tone facts: an unresolved leading tone into a tonic chord and an
 * unresolved chordal seventh.
 */

import type { TonalContext, VoiceId } from '../../music-types';
import { memberOfReading } from '../nct';
import type { AnalyzedSegment, PlacedVoiceNote } from '../segmentation';
import type { VoiceLeadingFact } from './facts';
import { VOICES, VOICE_LABEL } from './voice-state';

/** Tendency-tone facts need chord context — the segments carry the readings. */
export function tendencyFacts(
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

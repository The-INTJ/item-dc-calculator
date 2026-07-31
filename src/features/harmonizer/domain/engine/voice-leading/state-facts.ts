/**
 * Single-state facts about one sounding chord: crossing, spacing, range, and
 * the doubled leading tone.
 */

import type { TonalContext } from '../../music-types';
import type { VoiceLeadingFact } from './facts';
import { RANGES, VOICES, VOICE_LABEL, type VoiceState } from './voice-state';

export function stateFacts(atUnit: number, state: VoiceState, context: TonalContext): VoiceLeadingFact[] {
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

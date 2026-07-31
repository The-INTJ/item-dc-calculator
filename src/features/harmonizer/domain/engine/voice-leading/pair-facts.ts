/**
 * Motion facts between two adjacent voice states: parallel perfects,
 * hidden/direct perfects in the outer voices, and voice overlap.
 */

import type { VoiceLeadingFact } from './facts';
import { VOICES, VOICE_LABEL, simpleIntervalClass, type VoiceState } from './voice-state';

export function pairFacts(atUnit: number, from: VoiceState, to: VoiceState): VoiceLeadingFact[] {
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

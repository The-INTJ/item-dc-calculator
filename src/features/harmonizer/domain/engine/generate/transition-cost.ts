/* ---------------- stage B: transition cost ---------------- */

import type { SpelledPitch } from '../../music-types';
import type { StylePack } from '../style';
import type { Assignment } from './assignments';

export function transitionCost(
  previous: Assignment | { bass: SpelledPitch; tenor: SpelledPitch; alto: SpelledPitch },
  current: Assignment,
  previousSopranoMidi: number,
  sopranoMidi: number,
  style: StylePack,
): number {
  let cost = 0;
  const voices: Array<[number, number]> = [
    [sopranoMidi, previousSopranoMidi],
    [current.alto.midi, previous.alto.midi],
    [current.tenor.midi, previous.tenor.midi],
    [current.bass.midi, previous.bass.midi],
  ];
  // Parallels between every pair.
  for (let i = 0; i < voices.length; i += 1) {
    for (let j = i + 1; j < voices.length; j += 1) {
      const [aNow, aWas] = voices[i];
      const [bNow, bWas] = voices[j];
      if (aNow === aWas || bNow === bWas) continue;
      const wasInterval = Math.abs(aWas - bWas) % 12;
      const nowInterval = Math.abs(aNow - bNow) % 12;
      if (wasInterval === nowInterval && (nowInterval === 7 || nowInterval === 0)) {
        cost += style.voiceLeadingCost(
          nowInterval === 7 ? 'parallel_perfect_fifths' : 'parallel_octaves',
        );
      }
    }
  }
  // Smoothness over the inner voices and bass.
  let motion = 0;
  let commonTones = 0;
  for (const [now, was] of voices.slice(1)) {
    motion += Math.abs(now - was);
    if (now === was) commonTones += 1;
  }
  cost += motion * style.smoothness.semitoneCost;
  cost -= commonTones * style.smoothness.commonToneBonus;
  return cost;
}

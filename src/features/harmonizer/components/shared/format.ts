import type { SpelledPitch } from '../../domain/music-types';
import { content } from '../../content';

/** "G4", "F♯3" — absolute-pitch display text. */
export function pitchDisplay(pitch: SpelledPitch): string {
  return `${pitch.letter}${content.accidentalLabels[pitch.accidental]}${pitch.octave}`;
}

export function classes(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

import type { SpelledPitch, TonalContext } from '../../domain/music-types';
import { content } from '../../content';

/** "G4", "F♯3" — absolute-pitch display text. */
export function pitchDisplay(pitch: SpelledPitch): string {
  return `${pitch.letter}${content.accidentalLabels[pitch.accidental]}${pitch.octave}`;
}

/** "C major", "E♭ major", "F♯ minor" — key display text with real mode names. */
export function contextLabel(context: TonalContext): string {
  const accidental = content.accidentalLabels[context.tonic.accidental];
  return `${context.tonic.letter}${accidental} ${content.contextBar.modeShortLabels[context.mode]}`;
}

export function classes(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

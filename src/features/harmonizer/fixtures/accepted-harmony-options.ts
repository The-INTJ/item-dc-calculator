/**
 * Previous-harmony options for the accepted-context editor (spec §8.1) —
 * GENERATED for any supported key from the scale math and read through the
 * engine's key-relative analyzer, so the palette always matches what the
 * chord strip would say. Deterministic ids; no authored musical values.
 */

import { analyzeInKey } from '../domain/engine/roman';
import {
  SONORITY_TEMPLATES,
  type SonorityReading,
  type SonorityTemplate,
} from '../domain/engine/chord-id';
import type {
  ChordQuality,
  DiatonicDegree,
  HarmonyEvent,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../domain/music-types';
import { computeMidi } from '../domain/pitch';
import { spellDegree } from '../domain/scale';

interface PaletteEntry {
  /** Id-stable slug. */
  slug: string;
  /** Scale-degree members (degree, chromaticOffset), root first. */
  members: Array<{ degree: DiatonicDegree; chromaticOffset: number }>;
  quality: ChordQuality;
  /** Which member sounds in the bass (index into members). */
  bassMember: number;
}

/** I, I6, V, V7, vi — and their minor-mode counterparts (major V uses si). */
function paletteFor(context: TonalContext): PaletteEntry[] {
  const minor = context.mode !== 'major';
  const raisedThirdOfV = minor ? 1 : 0;
  return [
    { slug: 'i', members: [{ degree: 1, chromaticOffset: 0 }, { degree: 3, chromaticOffset: 0 }, { degree: 5, chromaticOffset: 0 }], quality: minor ? 'minor' : 'major', bassMember: 0 },
    { slug: 'i6', members: [{ degree: 1, chromaticOffset: 0 }, { degree: 3, chromaticOffset: 0 }, { degree: 5, chromaticOffset: 0 }], quality: minor ? 'minor' : 'major', bassMember: 1 },
    { slug: 'v', members: [{ degree: 5, chromaticOffset: 0 }, { degree: 7, chromaticOffset: raisedThirdOfV }, { degree: 2, chromaticOffset: 0 }], quality: 'major', bassMember: 0 },
    { slug: 'v7', members: [{ degree: 5, chromaticOffset: 0 }, { degree: 7, chromaticOffset: raisedThirdOfV }, { degree: 2, chromaticOffset: 0 }, { degree: 4, chromaticOffset: 0 }], quality: 'dominant_seventh', bassMember: 0 },
    { slug: 'vi', members: [{ degree: 6, chromaticOffset: 0 }, { degree: 1, chromaticOffset: 0 }, { degree: 3, chromaticOffset: 0 }], quality: minor ? 'major' : 'minor', bassMember: 0 },
  ];
}

/** Bass register: the option's bass pc placed in the hymnal bass range. */
function placeBass(tone: SpelledPitchClass): SpelledPitch {
  const octave = tone.pitchClass <= 4 ? 3 : 2;
  return { ...tone, octave, midi: computeMidi(tone.letter, tone.accidental, octave) };
}

export function listAcceptedHarmonyOptions(context: TonalContext): HarmonyEvent[] {
  const options: HarmonyEvent[] = [];
  for (const entry of paletteFor(context)) {
    const tones = entry.members.map((member) =>
      spellDegree(context, member.degree, member.chromaticOffset),
    );
    if (tones.some((tone) => tone === null)) continue; // unsupported context
    const spelledTones = tones as SpelledPitchClass[];
    const template = SONORITY_TEMPLATES.find(
      (candidate: SonorityTemplate) => candidate.quality === entry.quality,
    );
    if (!template) continue;
    const reading: SonorityReading = {
      kind: 'exact',
      root: spelledTones[0],
      quality: entry.quality,
      template,
      tones: spelledTones,
    };
    const bassPitch = placeBass(spelledTones[entry.bassMember]);
    const key = analyzeInKey(context, reading, bassPitch);
    options.push({
      id: `accepted-${context.tonic.letter}${context.tonic.accidental}-${context.mode}-${entry.slug}`,
      start: { measure: 0, beat: 1, subdivision: 0 },
      duration: { numerator: 1, denominator: 1 },
      chord: {
        id: `accepted-chord-${context.tonic.letter}${context.tonic.accidental}-${context.mode}-${entry.slug}`,
        root: spelledTones[0],
        pitchClasses: spelledTones.map((tone) => tone.pitchClass),
        spelledChordTones: spelledTones,
        quality: entry.quality,
      },
      analysis: key.analysis,
      inversion: key.inversion,
      bassPitch,
      displaySymbol: key.displaySymbol,
      ...(key.figuredBass !== undefined ? { figuredBass: key.figuredBass } : {}),
    });
  }
  return options;
}

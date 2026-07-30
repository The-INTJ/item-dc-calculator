/**
 * Property tests pitting our hand-rolled spelling/chord math against tonal as
 * an independent oracle (the bridge's documented role). tonal is never the
 * production source of truth — these tests are where it earns its keep.
 */
import { Chord, Key, Note } from 'tonal';
import { describe, expect, it } from 'vitest';
import type { SpelledPitchClass, TonalContext } from '../music-types';
import { parsePitchClass, toPcName } from '../pitch';
import { diatonicPitch } from '../scale';
import { SONORITY_TEMPLATES, identifySonority } from './chord-id';
import { fromSpn, keyInfo, transposeSpelled } from './tonal-bridge';

const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#'];

function majorContext(tonic: string): TonalContext {
  const spelled = parsePitchClass(tonic);
  return {
    tonic: spelled,
    tonicPitchClass: spelled.pitchClass,
    mode: 'major',
    solfegeSystem: 'movable_do',
  };
}

function minorContext(tonic: string): TonalContext {
  const spelled = parsePitchClass(tonic);
  return {
    tonic: spelled,
    tonicPitchClass: spelled.pitchClass,
    mode: 'natural_minor',
    minorDoSystem: 'la_based',
    solfegeSystem: 'movable_do',
  };
}

/** tonal writes double sharps as ## — normalize ours for comparison. */
function tonalName(spelled: SpelledPitchClass): string {
  return toPcName(spelled).replace('x', '##');
}

describe('scale spelling vs tonal Key (all 24 keys)', () => {
  it('spells every major scale degree exactly as tonal does', () => {
    for (const tonic of MAJOR_TONICS) {
      const context = majorContext(tonic);
      const oracle = Key.majorKey(tonic).scale;
      for (let degree = 1; degree <= 7; degree += 1) {
        const ours = diatonicPitch(context, degree as 1, 4);
        expect(ours, `${tonic} major degree ${degree}`).not.toBeNull();
        expect(tonalName(ours!), `${tonic} major degree ${degree}`).toBe(oracle[degree - 1]);
      }
    }
  });

  it('spells every natural-minor scale degree exactly as tonal does', () => {
    for (const tonic of MINOR_TONICS) {
      const context = minorContext(tonic);
      const oracle = Key.minorKey(tonic).natural.scale;
      for (let degree = 1; degree <= 7; degree += 1) {
        const ours = diatonicPitch(context, degree as 1, 4);
        expect(ours, `${tonic} minor degree ${degree}`).not.toBeNull();
        expect(tonalName(ours!), `${tonic} minor degree ${degree}`).toBe(oracle[degree - 1]);
      }
    }
  });

  it('agrees with tonal on every key signature', () => {
    // Our contexts must match tonal's accidental counts (slice 2 renders these).
    for (const tonic of MAJOR_TONICS) {
      expect(keyInfo(majorContext(tonic))?.signature).toBe(Key.majorKey(tonic).keySignature);
    }
    for (const tonic of MINOR_TONICS) {
      expect(keyInfo(minorContext(tonic))?.signature).toBe(Key.minorKey(tonic).keySignature);
    }
  });
});

describe('chord identification vs tonal Chord.detect', () => {
  it('agrees with tonal on the root of every template in every key', () => {
    for (const tonic of MAJOR_TONICS) {
      const root = parsePitchClass(tonic);
      for (const template of SONORITY_TEMPLATES) {
        // Build the chord's tones by transposing the root through the template.
        const intervalNames: Record<number, string> = {
          0: '1P', 2: '2M', 3: '3m', 4: '3M', 5: '4P', 6: '5d', 7: '5P', 8: '5A', 9: '6M',
          10: '7m', 11: '7M',
        };
        const rootPitch = fromSpn(`${tonic}3`);
        expect(rootPitch).not.toBeNull();
        const tones = template.intervals.map((interval) =>
          transposeSpelled(rootPitch!, intervalNames[interval]),
        );
        if (tones.some((tone) => tone === null)) continue; // triple-accidental spellings — out of scope
        const sounding = tones.map((tone) => tone!).sort((a, b) => a.midi - b.midi);

        const ours = identifySonority({ pitches: sounding, bassPc: sounding[0].pitchClass });
        expect(ours.kind, `${tonic} ${template.quality}`).toBe('exact');
        if (ours.kind !== 'exact') continue;

        const detected = Chord.detect(sounding.map((tone) => tonalName(tone)));
        expect(detected.length, `${tonic} ${template.quality}`).toBeGreaterThan(0);
        const oracleTonic = Chord.get(detected[0]).tonic;
        // Compare pitch classes — symbol formats differ, roots must not.
        expect(
          Note.chroma(oracleTonic ?? ''),
          `${tonic} ${template.quality}: ours ${toPcName(ours.root)} vs ${detected[0]}`,
        ).toBe(ours.root.pitchClass);
      }
    }
  });

  it('agrees with tonal that a bare fifth is a power chord', () => {
    const pitches = ['C3', 'G3'].map((spn) => fromSpn(spn)!);
    const ours = identifySonority({ pitches, bassPc: pitches[0].pitchClass });
    expect(ours.kind).toBe('open_fifth');
    expect(Chord.detect(['C', 'G'])).toContain('C5');
  });
});

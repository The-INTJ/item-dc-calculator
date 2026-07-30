import { describe, expect, it } from 'vitest';
import type { SpelledPitch } from '../music-types';
import { parsePitch } from '../pitch';
import { SONORITY_TEMPLATES, identifySonority } from './chord-id';

function pitches(...spns: string[]): SpelledPitch[] {
  return spns.map(parsePitch).sort((a, b) => a.midi - b.midi);
}

function identify(...spns: string[]) {
  const sounding = pitches(...spns);
  return identifySonority({ pitches: sounding, bassPc: sounding[0].pitchClass });
}

describe('identifySonority — exact matches', () => {
  it('recognizes every template in root position and every inversion', () => {
    // Each template built on C4, then rotated so each member takes the bass.
    const roots: Record<string, string[]> = {
      major: ['C4', 'E4', 'G4'],
      minor: ['C4', 'Eb4', 'G4'],
      diminished: ['C4', 'Eb4', 'Gb4'],
      augmented: ['C4', 'E4', 'G#4'],
      dominant_seventh: ['C4', 'E4', 'G4', 'Bb4'],
      major_seventh: ['C4', 'E4', 'G4', 'B4'],
      minor_seventh: ['C4', 'Eb4', 'G4', 'Bb4'],
      half_diminished_seventh: ['C4', 'Eb4', 'Gb4', 'Bb4'],
      fully_diminished_seventh: ['C4', 'Eb4', 'Gb4', 'Bbb4'],
      suspended_fourth: ['C4', 'F4', 'G4'],
      suspended_second: ['C4', 'D4', 'G4'],
    };
    for (const template of SONORITY_TEMPLATES) {
      const tones = roots[template.quality];
      expect(tones, template.quality).toBeDefined();
      for (let rotation = 0; rotation < tones!.length; rotation += 1) {
        // Drop the first `rotation` members an octave so a different member is lowest.
        const rotated = tones!.map((spn, i) =>
          i < rotation ? spn.replace(/\d$/, (o) => String(Number(o) + 1)) : spn,
        );
        const reading = identify(...rotated);
        // Fully diminished and augmented chords are symmetric — any member may
        // read as root; assert only that a full match was found.
        if (template.quality === 'fully_diminished_seventh' || template.quality === 'augmented') {
          expect(reading.kind, `${template.quality} rot ${rotation}`).toBe('exact');
          continue;
        }
        // sus2 inverted is another chord's sus4 — bass-first is the tiebreak,
        // so only assert root C in root position for the sus shapes.
        if (
          (template.quality === 'suspended_second' || template.quality === 'suspended_fourth') &&
          rotation > 0
        ) {
          expect(reading.kind, `${template.quality} rot ${rotation}`).toBe('exact');
          continue;
        }
        expect(reading.kind, `${template.quality} rot ${rotation}`).toBe('exact');
        if (reading.kind === 'exact') {
          expect(reading.root.pitchClass, `${template.quality} rot ${rotation}`).toBe(
            parsePitch(tones![0]).pitchClass,
          );
          expect(reading.quality).toBe(template.quality);
        }
      }
    }
  });

  it('collapses doublings before matching (SATB C-E-G-C = C major)', () => {
    const reading = identify('C3', 'C4', 'E4', 'G4');
    expect(reading.kind).toBe('exact');
    if (reading.kind === 'exact') {
      expect(reading.quality).toBe('major');
      expect(reading.root.letter).toBe('C');
    }
  });

  it("prefers the bass as root: A/C/E/G reads Am7, not C6", () => {
    const reading = identify('A2', 'C4', 'E4', 'G4');
    expect(reading.kind).toBe('exact');
    if (reading.kind === 'exact') {
      expect(reading.root.letter).toBe('A');
      expect(reading.quality).toBe('minor_seventh');
    }
  });
});

describe('identifySonority — the honesty ladder', () => {
  it('names a bare fifth as an open fifth, never an error', () => {
    const reading = identify('C3', 'G3', 'C4', 'G4');
    expect(reading.kind).toBe('open_fifth');
    if (reading.kind === 'open_fifth') expect(reading.root.letter).toBe('C');
  });

  it('asserts quality for a root+third dyad without claiming the fifth', () => {
    const major = identify('C3', 'E4');
    expect(major.kind).toBe('incomplete_triad');
    if (major.kind === 'incomplete_triad') {
      expect(major.quality).toBe('major');
      expect(major.missing).toBe('fifth');
    }
    const minor = identify('A3', 'C4');
    expect(minor.kind).toBe('incomplete_triad');
    if (minor.kind === 'incomplete_triad') expect(minor.quality).toBe('minor');
  });

  it('reads a sixth as a dyad offering the inverted-third candidate', () => {
    const reading = identify('C4', 'A4'); // M6 = inverted m3 — Am without fifth
    expect(reading.kind).toBe('dyad');
    if (reading.kind === 'dyad') {
      expect(reading.interval).toBe('6M');
      expect(reading.candidates).toHaveLength(1);
      expect(reading.candidates[0].kind).toBe('incomplete_triad');
      if (reading.candidates[0].kind === 'incomplete_triad') {
        expect(reading.candidates[0].root.letter).toBe('A');
        expect(reading.candidates[0].quality).toBe('minor');
      }
    }
  });

  it('names other dyads by interval with no candidates', () => {
    const second = identify('E4', 'F4');
    expect(second.kind).toBe('dyad');
    if (second.kind === 'dyad') {
      expect(second.interval).toBe('2m');
      expect(second.candidates).toHaveLength(0);
    }
  });

  it('explains a 5-pc sonority as chord + leftover (V7 with a 4-3 suspension)', () => {
    // G7 (G-B-D-F) with a sounding C — the suspended fourth over the dominant.
    const reading = identify('G2', 'B3', 'D4', 'F4', 'C5');
    expect(reading.kind).toBe('subset');
    if (reading.kind === 'subset') {
      expect(reading.root.letter).toBe('G');
      expect(reading.quality).toBe('dominant_seventh');
      expect(reading.leftovers).toHaveLength(1);
      expect(reading.leftovers[0].pitch.letter).toBe('C');
    }
  });

  it('returns monad for a single sounding pitch class', () => {
    const reading = identify('C3', 'C4');
    expect(reading.kind).toBe('monad');
  });

  it('returns unknown for a 3-pc cluster no template or subset explains', () => {
    const reading = identify('C4', 'D4', 'E4');
    expect(reading.kind).toBe('unknown');
    if (reading.kind === 'unknown') {
      expect(reading.tones.map((tone) => tone.letter)).toEqual(['C', 'D', 'E']);
    }
  });
});

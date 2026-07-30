import { describe, expect, it } from 'vitest';
import type { SATBVoicing, TonalContext, VoiceEvent, VoiceId } from '../music-types';
import { parsePitch, parsePitchClass } from '../pitch';
import { unitsToDuration, unitsToTime } from '../timing';
import { placedVoiceLines, segmentSurface } from './segmentation';
import { checkVoiceLeading, type VoiceLeadingFact } from './voice-leading';

const C_MAJOR: TonalContext = {
  tonic: parsePitchClass('C'),
  tonicPitchClass: 0,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

let nextId = 0;
function note(voice: VoiceId, spn: string, startUnit: number, units: number): VoiceEvent {
  nextId += 1;
  return {
    id: `vl-${voice}-${nextId}`,
    voice,
    pitch: parsePitch(spn),
    scaleDegree: { degree: 1, chromaticOffset: 0, syllable: 'do' },
    start: unitsToTime(startUnit),
    duration: unitsToDuration(units),
    tieFromPrevious: false,
  };
}

function voicing(events: VoiceEvent[]): SATBVoicing {
  return {
    soprano: events.filter((event) => event.voice === 'soprano'),
    alto: events.filter((event) => event.voice === 'alto'),
    tenor: events.filter((event) => event.voice === 'tenor'),
    bass: events.filter((event) => event.voice === 'bass'),
  };
}

function factsFor(events: VoiceEvent[]): VoiceLeadingFact[] {
  const surface = voicing(events);
  return checkVoiceLeading(placedVoiceLines(surface), segmentSurface(surface), C_MAJOR);
}

describe('checkVoiceLeading', () => {
  it('reports parallel fifths and octaves only when both voices move', () => {
    const parallel = factsFor([
      note('soprano', 'C4', 0, 8),
      note('soprano', 'D4', 8, 8),
      note('bass', 'F3', 0, 8),
      note('bass', 'G3', 8, 8),
    ]);
    expect(parallel.some((fact) => fact.id === 'parallel_perfect_fifths')).toBe(true);

    const repeated = factsFor([
      note('soprano', 'C4', 0, 8),
      note('soprano', 'C4', 8, 8),
      note('bass', 'F3', 0, 8),
      note('bass', 'F3', 8, 8),
    ]);
    expect(repeated.some((fact) => fact.id === 'parallel_perfect_fifths')).toBe(false);
  });

  it('flags hidden outer perfects only with similar motion and a soprano leap', () => {
    const hidden = factsFor([
      note('soprano', 'E4', 0, 8),
      note('soprano', 'C5', 8, 8), // leap up
      note('bass', 'C3', 0, 8),
      note('bass', 'F3', 8, 8), // same direction into a fifth
    ]);
    expect(hidden.some((fact) => fact.id === 'hidden_fifth_outer')).toBe(true);

    const stepwise = factsFor([
      note('soprano', 'B4', 0, 8),
      note('soprano', 'C5', 8, 8), // step — fine
      note('bass', 'E3', 0, 8),
      note('bass', 'F3', 8, 8),
    ]);
    expect(stepwise.some((fact) => fact.id === 'hidden_fifth_outer')).toBe(false);
  });

  it('reports crossing, spacing, and range observations', () => {
    const facts = factsFor([
      note('soprano', 'C4', 0, 8),
      note('alto', 'E4', 0, 8), // above the soprano — crossing
      note('tenor', 'C3', 0, 8), // more than an octave below the alto
      note('bass', 'C2', 0, 8), // below the comfortable bass floor
    ]);
    expect(facts.some((fact) => fact.id === 'voice_crossing')).toBe(true);
    expect(facts.some((fact) => fact.id === 'spacing_at_exceeded')).toBe(true);
    expect(facts.some((fact) => fact.id === 'range_exceeded')).toBe(true);
  });

  it('reports a doubled leading tone', () => {
    const facts = factsFor([
      note('soprano', 'B4', 0, 8),
      note('alto', 'B3', 0, 8),
      note('tenor', 'G3', 0, 8),
      note('bass', 'G2', 0, 8),
    ]);
    expect(facts.some((fact) => fact.id === 'doubled_leading_tone')).toBe(true);
  });

  it('watches tendency tones: leading tone into tonic, sevenths down by step', () => {
    // Outer-voice ti leaping away from a V→I close.
    const unresolvedLeadingTone = factsFor([
      note('soprano', 'B4', 0, 8),
      note('soprano', 'G4', 8, 8), // down a third instead of up to do
      note('alto', 'D4', 0, 8),
      note('alto', 'E4', 8, 8),
      note('tenor', 'G3', 0, 8),
      note('tenor', 'G3', 8, 8),
      note('bass', 'G2', 0, 8),
      note('bass', 'C3', 8, 8),
    ]);
    expect(unresolvedLeadingTone.some((fact) => fact.id === 'leading_tone_unresolved')).toBe(true);

    // The chordal seventh of G7 rising instead of falling.
    const unresolvedSeventh = factsFor([
      note('soprano', 'F4', 0, 8),
      note('soprano', 'G4', 8, 8), // seventh moves UP
      note('alto', 'B3', 0, 8),
      note('alto', 'C4', 8, 8),
      note('tenor', 'D3', 0, 8),
      note('tenor', 'E3', 8, 8),
      note('bass', 'G2', 0, 8),
      note('bass', 'C3', 8, 8),
    ]);
    expect(unresolvedSeventh.some((fact) => fact.id === 'seventh_unresolved')).toBe(true);

    // Textbook resolution: no tendency facts.
    const resolved = factsFor([
      note('soprano', 'B4', 0, 8),
      note('soprano', 'C5', 8, 8),
      note('alto', 'F4', 0, 8),
      note('alto', 'E4', 8, 8),
      note('tenor', 'D4', 0, 8),
      note('tenor', 'C4', 8, 8),
      note('bass', 'G2', 0, 8),
      note('bass', 'C3', 8, 8),
    ]);
    expect(resolved.some((fact) => fact.id === 'leading_tone_unresolved')).toBe(false);
    expect(resolved.some((fact) => fact.id === 'seventh_unresolved')).toBe(false);
  });

  it('emits facts in deterministic timeline order', () => {
    const events = [
      note('soprano', 'C4', 0, 8),
      note('alto', 'E4', 0, 8),
      note('tenor', 'C3', 0, 8),
      note('bass', 'C2', 0, 8),
    ];
    const first = factsFor(events);
    const second = factsFor(events);
    expect(first).toEqual(second);
  });
});

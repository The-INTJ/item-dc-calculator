import { describe, expect, it } from 'vitest';
import type { SATBVoicing, TonalContext, VoiceEvent, VoiceId } from '../music-types';
import { parsePitch, parsePitchClass } from '../pitch';
import { unitsToDuration, unitsToTime } from '../timing';
import { keySanityCheck } from './key-sanity';

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
    id: `ks-${voice}-${nextId}`,
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

describe('keySanityCheck', () => {
  it('stays quiet when the declared key fits', () => {
    const surface = voicing([
      note('soprano', 'E4', 0, 8),
      note('soprano', 'D4', 8, 4),
      note('soprano', 'C4', 12, 4),
      note('alto', 'G3', 0, 16),
      note('bass', 'C3', 0, 16),
    ]);
    expect(keySanityCheck(surface, C_MAJOR, 't')).toBeNull();
  });

  it('flags a surface that clearly lives in another key', () => {
    // Emphatic D-major content (F#, C#, D, A) declared as C major.
    const surface = voicing([
      note('soprano', 'F#4', 0, 8),
      note('soprano', 'A4', 8, 8),
      note('alto', 'D4', 0, 16),
      note('tenor', 'A3', 0, 8),
      note('tenor', 'C#4', 8, 8),
      note('bass', 'D3', 0, 16),
    ]);
    const flag = keySanityCheck(surface, C_MAJOR, 't');
    expect(flag).not.toBeNull();
    expect(flag!.featureId).toBe('key_profile_mismatch');
    expect(String(flag!.value)).toContain('D');
  });

  it('never flags the relative minor/major pair', () => {
    // A-minor-leaning content declared as C major: la-based minor makes the
    // relative distinction meaningless — stay quiet.
    const surface = voicing([
      note('soprano', 'A4', 0, 8),
      note('soprano', 'B4', 8, 4),
      note('soprano', 'C5', 12, 4),
      note('alto', 'E4', 0, 16),
      note('bass', 'A2', 0, 16),
    ]);
    expect(keySanityCheck(surface, C_MAJOR, 't')).toBeNull();
  });

  it('returns null for an empty surface', () => {
    expect(
      keySanityCheck({ soprano: [], alto: [], tenor: [], bass: [] }, C_MAJOR, 't'),
    ).toBeNull();
  });
});

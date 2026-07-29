import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../fixtures/registry';
import {
  deriveHarmonyFromVoicing,
  USER_GENERATOR_ID,
  withDerivedAnalysis,
} from './derive-harmony';
import type {
  SATBVoicing,
  SpelledPitch,
  TonalContext,
  VoiceEvent,
  VoiceId,
} from './music-types';
import { spellPitch } from './scale';
import { unitsToDuration, unitsToTime } from './timing';

const fixture = getDefaultFixture();
const C_MAJOR = fixture.initialState.tonalContext;

const A_MINOR: TonalContext = {
  tonic: { letter: 'A', accidental: 'natural', pitchClass: 9 },
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

let nextId = 0;
function note(
  voice: VoiceId,
  pitch: SpelledPitch,
  startUnit: number,
  units: number,
): VoiceEvent {
  nextId += 1;
  return {
    id: `t-${voice}-${nextId}`,
    voice,
    pitch,
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

describe('deriveHarmonyFromVoicing', () => {
  it("names Drew's example: melody sol over la/do/mi in A minor = Am7 (i7)", () => {
    // ATB hold la/do/mi (A-C-E); the melody la was edited down to sol (G).
    // The notes were NOT reassigned — but together they ARE a chord: Am7.
    const events = deriveHarmonyFromVoicing(
      voicing([
        note('soprano', spellPitch('G', 'natural', 4), 0, 16),
        note('alto', spellPitch('E', 'natural', 4), 0, 16),
        note('tenor', spellPitch('C', 'natural', 4), 0, 16),
        note('bass', spellPitch('A', 'natural', 2), 0, 16),
      ]),
      A_MINOR,
      'x',
    );
    expect(events).toHaveLength(1);
    expect(events[0].displaySymbol).toBe('Am7');
    expect(events[0].chord.quality).toBe('minor_seventh');
    expect(events[0].analysis.romanNumeral).toBe('i7');
    expect(events[0].inversion).toBe(0);
  });

  it('prefers the bass as root and reads inversions from the actual bass', () => {
    // C major triad with E in the bass = first inversion, still I.
    const events = deriveHarmonyFromVoicing(
      voicing([
        note('soprano', spellPitch('C', 'natural', 5), 0, 16),
        note('alto', spellPitch('G', 'natural', 4), 0, 16),
        note('tenor', spellPitch('C', 'natural', 4), 0, 16),
        note('bass', spellPitch('E', 'natural', 3), 0, 16),
      ]),
      C_MAJOR,
      'x',
    );
    expect(events[0].displaySymbol).toBe('C');
    expect(events[0].analysis.romanNumeral).toBe('I');
    expect(events[0].inversion).toBe(1);
    expect(events[0].bassPitch.letter).toBe('E');
  });

  it('shows unnameable sonorities as ? with the sounding notes', () => {
    const events = deriveHarmonyFromVoicing(
      voicing([
        note('soprano', spellPitch('F', 'natural', 4), 0, 16),
        note('alto', spellPitch('E', 'natural', 4), 0, 16),
      ]),
      C_MAJOR,
      'x',
    );
    expect(events[0].analysis.romanNumeral).toBe('?');
    expect(events[0].chord.quality).toBe('other');
    expect(events[0].displaySymbol).toBe('E+F');
  });

  it('segments at every note boundary and merges identical sonorities', () => {
    // Alto moves G→A halfway: I for the first half, then C-E-A = vi6.
    const events = deriveHarmonyFromVoicing(
      voicing([
        note('soprano', spellPitch('E', 'natural', 4), 0, 16),
        note('alto', spellPitch('G', 'natural', 3), 0, 8),
        note('alto', spellPitch('A', 'natural', 3), 8, 8),
        note('bass', spellPitch('C', 'natural', 3), 0, 16),
      ]),
      C_MAJOR,
      'x',
    );
    expect(events).toHaveLength(2);
    expect(events[0].analysis.romanNumeral).toBe('I');
    expect(events[1].displaySymbol).toBe('Am');
    expect(events[1].inversion).toBe(1); // C in the bass under an Am triad
  });
});

describe('withDerivedAnalysis', () => {
  it('re-derives analysis without moving a note and flips provenance once', () => {
    const candidate = fixture.candidateSets[0].candidates[0];
    const derived = withDerivedAnalysis(candidate, fixture.initialState.fragment, C_MAJOR);
    // The notes are untouched — the surface rule.
    expect(derived.voicing).toEqual(candidate.voicing);
    expect(derived.provenance.generatorId).toBe(USER_GENERATOR_ID);
    expect(derived.provenance.fixtureAuthored).toBe(false);
    expect(derived.descriptors).toEqual([]);
    expect(derived.derivability?.some((entry) => entry.aspect === 'chord_path')).toBe(true);
    expect(derived.harmonyEvents.length).toBeGreaterThan(0);
    // Deriving again is stable.
    const again = withDerivedAnalysis(derived, fixture.initialState.fragment, C_MAJOR);
    expect(again.harmonyEvents.map((event) => event.displaySymbol)).toEqual(
      derived.harmonyEvents.map((event) => event.displaySymbol),
    );
  });
});

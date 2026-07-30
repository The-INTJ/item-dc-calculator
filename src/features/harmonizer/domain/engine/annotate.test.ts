import { describe, expect, it } from 'vitest';
import { withDerivedAnalysis } from '../derive-harmony';
import { getFixtureById } from '../../fixtures/registry';
import type { ApproachContext } from '../approach';
import type { MelodyFragment, SATBVoicing, TonalContext, VoiceEvent, VoiceId } from '../music-types';
import { parsePitch, parsePitchClass } from '../pitch';
import { unitsToDuration, unitsToTime } from '../timing';
import { annotateVoicing } from './annotate';

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
    id: `an-${voice}-${nextId}`,
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

function fragmentOf(soprano: VoiceEvent[]): MelodyFragment {
  return {
    id: 'an-frag',
    events: soprano.map((event) => ({
      id: event.id,
      pitch: event.pitch,
      scaleDegree: event.scaleDegree,
      start: event.start,
      duration: event.duration,
      tieFromPrevious: event.tieFromPrevious,
    })),
  };
}

describe("fixture B's suspension, found by math", () => {
  it('reads the held do over the arriving V as a 4-3 suspension', () => {
    const fixture = getFixtureById('c-major-do-ti-suspension')!;
    const candidate = fixture.candidateSets[0].candidates.find(
      (entry) => entry.id === 'suspended-arrival',
    )!;
    const derived = withDerivedAnalysis(
      candidate,
      fixture.initialState.fragment,
      fixture.initialState.tonalContext,
    );

    // The chord strip re-reads the sus sonority as V carrying a 4-3.
    const suspended = derived.harmonyEvents.find((event) => event.figuredBass === '4-3');
    expect(suspended).toBeDefined();
    expect(suspended!.displaySymbol).toBe('G');
    expect(suspended!.analysis.romanNumeral).toBe('V');

    // The melody's held do is classified as the suspension, resolving to ti.
    const doReading = derived.melodyInterpretations[0];
    expect(doReading.role).toBe('suspension');
    expect(doReading.suspensionType).toBe('4-3');
    expect(doReading.resolutionEventId).toBe('b-mel-ti');
    expect(doReading.harmonyEventIds).toHaveLength(2);
    const tiReading = derived.melodyInterpretations[1];
    expect(tiReading.role).toBe('chord_tone');

    // Derivability now claims interpretation as computed.
    expect(
      derived.derivability?.find((entry) => entry.aspect === 'interpretation')?.status,
    ).toBe('computed');
  });
});

describe('the approach seam feeds the classifier', () => {
  it('classifies a first-note suspension prepared by the previous piece', () => {
    // The piece arrives from a C chord where the soprano sang C5; the new
    // snippet opens on that same C5 over a G chord, falling to B4.
    const events = [
      note('soprano', 'C5', 0, 8),
      note('soprano', 'B4', 8, 8),
      note('alto', 'D4', 0, 16),
      note('tenor', 'G3', 0, 16),
      note('bass', 'G2', 0, 16),
    ];
    const approach: ApproachContext = {
      harmony: {
        id: 'seam-c',
        start: { measure: 0, beat: 1, subdivision: 0 },
        duration: { numerator: 1, denominator: 1 },
        chord: {
          id: 'seam-c-chord',
          root: parsePitchClass('C'),
          pitchClasses: [0, 4, 7],
          spelledChordTones: [parsePitchClass('C'), parsePitchClass('E'), parsePitchClass('G')],
          quality: 'major',
        },
        analysis: {
          romanNumeral: 'I',
          scaleDegreeRoot: { degree: 1, chromaticOffset: 0, syllable: 'do' },
          functionTags: ['tonic'],
        },
        inversion: 0,
        bassPitch: parsePitch('C3'),
        displaySymbol: 'C',
      },
      voices: {
        soprano: {
          pitch: parsePitch('C5'),
          scaleDegree: { degree: 1, chromaticOffset: 0, syllable: 'do' },
        },
      },
    };
    const surface = voicing(events);
    const result = annotateVoicing(
      surface,
      fragmentOf(surface.soprano),
      C_MAJOR,
      approach,
      'seamtest',
    );
    const first = result.melodyInterpretations[0];
    expect(first.role).toBe('suspension');
    expect(first.preparationEventId).toBe('approach:soprano');
    expect(first.evidence.some((entry) => entry.featureId === 'approach_seam')).toBe(true);

    // Without the seam, the same note has no preparation: honest ambiguity.
    const withoutSeam = annotateVoicing(
      surface,
      fragmentOf(surface.soprano),
      C_MAJOR,
      null,
      'seamtest2',
    );
    expect(withoutSeam.melodyInterpretations[0].role).not.toBe('suspension');
  });
});

describe('cadential six-four', () => {
  it('tags a strong-beat tonic 6/4 moving to V as dominant function', () => {
    const surface = voicing([
      note('soprano', 'E4', 0, 8),
      note('soprano', 'D4', 8, 8),
      note('alto', 'C4', 0, 8),
      note('alto', 'B3', 8, 8),
      note('tenor', 'G3', 0, 16),
      note('bass', 'G2', 0, 16),
    ]);
    const result = annotateVoicing(surface, fragmentOf(surface.soprano), C_MAJOR, null, 'cad');
    expect(result.harmonyEvents[0].analysis.romanNumeral).toBe('I6/4');
    expect(result.harmonyEvents[0].analysis.functionTags).toEqual(['dominant']);
    expect(result.evidence.some((entry) => entry.featureId === 'cadence_reading')).toBe(true);
    expect(result.harmonyEvents[1].analysis.romanNumeral).toBe('V');
  });
});

describe('voice-leading facts ride the candidate evidence', () => {
  it('carries parallels and key sanity as evidence entries', () => {
    const surface = voicing([
      note('soprano', 'C4', 0, 8),
      note('soprano', 'D4', 8, 8),
      note('bass', 'F3', 0, 8),
      note('bass', 'G3', 8, 8),
    ]);
    const result = annotateVoicing(surface, fragmentOf(surface.soprano), C_MAJOR, null, 'vl');
    expect(
      result.evidence.some((entry) => entry.featureId === 'parallel_perfect_fifths'),
    ).toBe(true);
  });
});

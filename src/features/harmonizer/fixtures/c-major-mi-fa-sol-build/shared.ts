/**
 * Fixture D — rising melody, build (spec §11.4). The melody shares fixture A's
 * exact rhythm (q q h) so it is reachable from the default fixture with pitch
 * arrows alone — the hero demo of live regeneration. Match omits phrase intent
 * and accepted harmony (wildcards).
 */

import type { CandidateProvenance } from '../../domain/analysis-types';
import type { FixtureInitialState, FixtureMatchCriteria } from '../../domain/fixture-types';
import type { BoundaryConstraint, MelodyFragment, TonalContext, VoiceEvent } from '../../domain/music-types';
import { at, deg, H, pc, pitch, Q } from '../authoring';

export const FIXTURE_D_ID = 'c-major-mi-fa-sol-build';

export const tonalContext: TonalContext = {
  tonic: pc('C'),
  tonicPitchClass: 0,
  mode: 'major',
  keySignature: 'C',
  solfegeSystem: 'movable_do',
};

export const melodyFragment: MelodyFragment = {
  id: 'fragment-mi-fa-sol',
  events: [
    {
      id: 'd-mel-mi',
      pitch: pitch('E4'),
      scaleDegree: deg(3, 'mi'),
      start: at(1, 1),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'strong',
    },
    {
      id: 'd-mel-fa',
      pitch: pitch('F4'),
      scaleDegree: deg(4, 'fa'),
      start: at(1, 2),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'weak',
    },
    {
      id: 'd-mel-sol',
      pitch: pitch('G4'),
      scaleDegree: deg(5, 'sol'),
      start: at(1, 3),
      duration: H,
      tieFromPrevious: false,
      metricStrength: 'medium',
    },
  ],
};

export const boundaryConstraints: BoundaryConstraint[] = [
  { afterMelodyEventId: 'd-mel-mi', policy: 'allowed' },
  { afterMelodyEventId: 'd-mel-fa', policy: 'allowed' },
];

export const initialState: FixtureInitialState = {
  tonalContext,
  phraseIntent: 'build',
  tempoBpm: 76,
  acceptedContext: { previousHarmony: null, previousVoicing: null },
  fragment: melodyFragment,
  boundaryConstraints,
};

export const match: FixtureMatchCriteria = {
  tonalContext: { tonicPitchClass: 0, mode: 'major' },
  melodySignature: 'mi4:q|fa4:q|sol4:h',
  phraseIntent: 'build',
};

export const fixtureProvenance: CandidateProvenance = {
  generatorId: 'fixture',
  generatorVersion: '0.1.0',
  knowledgePackIds: ['poc-hymn-major-v1'],
  fixtureAuthored: true,
};

export function sopranoFromMelody(idPrefix: string): VoiceEvent[] {
  return melodyFragment.events.map((event, index) => ({
    id: `${idPrefix}-s-${index + 1}`,
    voice: 'soprano' as const,
    pitch: event.pitch,
    scaleDegree: event.scaleDegree,
    start: event.start,
    duration: event.duration,
    tieFromPrevious: event.tieFromPrevious,
  }));
}

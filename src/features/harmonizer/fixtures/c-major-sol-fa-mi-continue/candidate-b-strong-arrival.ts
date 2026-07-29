/**
 * Candidate B — "Strong arrival" (spec §11.1 theme 2, Appendix A copy).
 * V7 spans beats 1–2 (sol = root, fa = chordal seventh), resolving to
 * root-position I on beats 3–4. Textbook resolution: incomplete V7 (omitted
 * fifth, doubled root) → complete I; leading tone up, seventh down, tenor
 * holds the common tone.
 */

import type { CandidatePath } from '../../domain/analysis-types';
import { at, deg, H, pitch } from '../authoring';
import {
  cMajorTriad,
  FIXTURE_ID,
  fixtureProvenance,
  g7Chord,
  initialState,
  sopranoFromMelody,
} from './shared';

export const candidateB: CandidatePath = {
  id: 'strong-arrival',
  fixtureId: FIXTURE_ID,
  title: 'Strong arrival',
  summary: 'Use fa as the seventh of V7 and resolve it downward to mi.',
  tonalContext: initialState.tonalContext,
  phraseIntent: initialState.phraseIntent,
  harmonyEvents: [
    {
      id: 'b-harm-v7',
      start: at(1, 1),
      duration: H,
      chord: g7Chord,
      analysis: {
        romanNumeral: 'V7',
        scaleDegreeRoot: deg(5, 'sol'),
        functionTags: ['dominant'],
      },
      inversion: 0,
      bassPitch: pitch('G2'),
      displaySymbol: 'G7',
    },
    {
      id: 'b-harm-i',
      start: at(1, 3),
      duration: H,
      chord: cMajorTriad,
      analysis: {
        romanNumeral: 'I',
        scaleDegreeRoot: deg(1, 'do'),
        functionTags: ['tonic'],
      },
      inversion: 0,
      bassPitch: pitch('C3'),
      displaySymbol: 'C',
    },
  ],
  voicing: {
    soprano: sopranoFromMelody('b'),
    alto: [
      {
        id: 'b-a-1',
        voice: 'alto',
        pitch: pitch('B3'),
        scaleDegree: deg(7, 'ti'),
        start: at(1, 1),
        duration: H,
        tieFromPrevious: false,
      },
      {
        id: 'b-a-2',
        voice: 'alto',
        pitch: pitch('C4'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 3),
        duration: H,
        tieFromPrevious: false,
      },
    ],
    tenor: [
      {
        id: 'b-t-1',
        voice: 'tenor',
        pitch: pitch('G3'),
        scaleDegree: deg(5, 'sol'),
        start: at(1, 1),
        duration: H,
        tieFromPrevious: false,
      },
      {
        id: 'b-t-2',
        voice: 'tenor',
        pitch: pitch('G3'),
        scaleDegree: deg(5, 'sol'),
        start: at(1, 3),
        duration: H,
        tieFromPrevious: true,
      },
    ],
    bass: [
      {
        id: 'b-b-1',
        voice: 'bass',
        pitch: pitch('G2'),
        scaleDegree: deg(5, 'sol'),
        start: at(1, 1),
        duration: H,
        tieFromPrevious: false,
      },
      {
        id: 'b-b-2',
        voice: 'bass',
        pitch: pitch('C3'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 3),
        duration: H,
        tieFromPrevious: false,
      },
    ],
  },
  melodyInterpretations: [
    {
      melodyEventId: 'mel-sol',
      harmonyEventIds: ['b-harm-v7'],
      role: 'chord_tone',
      explanation: 'Sol is the root of V7, doubled by the bass.',
      evidence: [
        {
          id: 'b-int-sol-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: true,
          explanation: 'G is the root of G7.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
      ],
    },
    {
      melodyEventId: 'mel-fa',
      harmonyEventIds: ['b-harm-v7'],
      role: 'chord_tone',
      resolutionEventId: 'mel-mi',
      explanation:
        'The soprano’s fa belongs to V7 as the chordal seventh and resolves by step to mi over tonic.',
      evidence: [
        {
          id: 'b-int-fa-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: true,
          explanation: 'F is present in G7.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'b-int-fa-2',
          source: 'computed',
          featureId: 'stepwise_resolution',
          value: true,
          explanation: 'F descends one diatonic step to E.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'b-int-fa-3',
          source: 'rule',
          featureId: 'seventh_resolution_rule',
          value: true,
          explanation: 'A dominant seventh normally resolves downward.',
          providerId: 'poc-hymn-major-v1',
          providerVersion: '0.1.0',
        },
        {
          id: 'b-int-fa-4',
          source: 'curated',
          featureId: 'arrival_label',
          value: 'strong',
          explanation: 'Creates a strong audible arrival into I.',
          providerId: 'poc-hymn-major-v1',
          providerVersion: '0.1.0',
        },
      ],
    },
    {
      melodyEventId: 'mel-mi',
      harmonyEventIds: ['b-harm-i'],
      role: 'chord_tone',
      explanation: 'Mi is the third of the tonic chord of arrival.',
      evidence: [
        {
          id: 'b-int-mi-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: true,
          explanation: 'E is a tone of the C major triad.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
      ],
    },
  ],
  descriptors: [
    {
      id: 'b-desc-closure',
      dimension: 'closure_strength',
      label: 'strong dominant arrival',
      explanation:
        'The bass motion sol–do and dominant-to-tonic progression make this the most closing reading of the three.',
      evidenceIds: ['b-ev-1', 'b-ev-2'],
      source: 'curated',
    },
    {
      id: 'b-desc-tension',
      dimension: 'tension',
      label: 'dominant pressure before release',
      explanation: 'Creates dominant pressure followed by a clear arrival.',
      evidenceIds: ['b-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'b-ev-1',
      source: 'computed',
      featureId: 'root_motion',
      value: 'descending_fifth',
      explanation: 'The roots move sol to do, a descending fifth.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
    {
      id: 'b-ev-2',
      source: 'rule',
      featureId: 'cadence_shape',
      value: 'authentic',
      explanation:
        'V7 to root-position I with stepwise soprano descent forms an authentic cadence shape.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 2,
  provenance: fixtureProvenance,
};

/**
 * Candidate C — "Keep moving" (spec §11.1 theme 3, Appendix A copy).
 * I moving to I6: tonic function preserved, closure weakened by the bass on
 * mi. The voicing is authored verbatim from the spec's wireframe (§9.1 lines
 * 297–303): beat 2 is passing motion in three voices over a held bass do.
 * Known quirks kept as authored data, to be judged by ear: the final sonority
 * (E3–C4–C4–E4) has no fifth and a tenor/alto unison; the musically safer
 * tenor line do–ti–sol abandons the wireframe, so it stays a data tweak for
 * later if this sounds hollow.
 */

import type { CandidatePath } from '../../domain/analysis-types';
import { at, deg, H, pitch, Q } from '../authoring';
import {
  cMajorTriad,
  FIXTURE_ID,
  fixtureProvenance,
  initialState,
  sopranoFromMelody,
} from './shared';

export const candidateC: CandidatePath = {
  id: 'keep-moving',
  fixtureId: FIXTURE_ID,
  title: 'Keep moving',
  summary: 'Preserve tonic function while moving the bass to the third.',
  tonalContext: initialState.tonalContext,
  phraseIntent: initialState.phraseIntent,
  harmonyEvents: [
    {
      id: 'c-harm-i',
      start: at(1, 1),
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
    {
      id: 'c-harm-i6',
      start: at(1, 3),
      duration: H,
      chord: cMajorTriad,
      analysis: {
        romanNumeral: 'I6',
        scaleDegreeRoot: deg(1, 'do'),
        functionTags: ['tonic'],
      },
      inversion: 1,
      bassPitch: pitch('E3'),
      figuredBass: '6',
      displaySymbol: 'C/E',
    },
  ],
  voicing: {
    soprano: sopranoFromMelody('c'),
    alto: [
      {
        id: 'c-a-1',
        voice: 'alto',
        pitch: pitch('E4'),
        scaleDegree: deg(3, 'mi'),
        start: at(1, 1),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-a-2',
        voice: 'alto',
        pitch: pitch('D4'),
        scaleDegree: deg(2, 're'),
        start: at(1, 2),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-a-3',
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
        id: 'c-t-1',
        voice: 'tenor',
        pitch: pitch('C4'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 1),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-t-2',
        voice: 'tenor',
        pitch: pitch('B3'),
        scaleDegree: deg(7, 'ti'),
        start: at(1, 2),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-t-3',
        voice: 'tenor',
        pitch: pitch('C4'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 3),
        duration: H,
        tieFromPrevious: false,
      },
    ],
    bass: [
      {
        id: 'c-b-1',
        voice: 'bass',
        pitch: pitch('C3'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 1),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-b-2',
        voice: 'bass',
        pitch: pitch('C3'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 2),
        duration: Q,
        tieFromPrevious: false,
      },
      {
        id: 'c-b-3',
        voice: 'bass',
        pitch: pitch('E3'),
        scaleDegree: deg(3, 'mi'),
        start: at(1, 3),
        duration: H,
        tieFromPrevious: false,
      },
    ],
  },
  melodyInterpretations: [
    {
      melodyEventId: 'mel-sol',
      harmonyEventIds: ['c-harm-i'],
      role: 'chord_tone',
      explanation: 'Sol is the fifth of the tonic triad.',
      evidence: [
        {
          id: 'c-int-sol-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: true,
          explanation: 'G is a tone of the C major triad.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
      ],
    },
    {
      melodyEventId: 'mel-fa',
      harmonyEventIds: ['c-harm-i'],
      role: 'passing_tone',
      preparationEventId: 'mel-sol',
      resolutionEventId: 'mel-mi',
      explanation:
        'Fa passes between sol and mi while the inner voices move through passing tones toward the inversion.',
      evidence: [
        {
          id: 'c-int-fa-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: false,
          explanation: 'F is not a tone of the C major triad.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'c-int-fa-2',
          source: 'computed',
          featureId: 'stepwise_motion',
          value: true,
          explanation: 'F is approached and left by descending step.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'c-int-fa-3',
          source: 'rule',
          featureId: 'passing_tone_rule',
          value: true,
          explanation: 'An unaccented passing tone may connect two chord tones on a weak beat.',
          providerId: 'poc-hymn-major-v1',
          providerVersion: '0.1.0',
        },
      ],
    },
    {
      melodyEventId: 'mel-mi',
      harmonyEventIds: ['c-harm-i6'],
      role: 'chord_tone',
      explanation:
        'The final sonority remains tonic, but first inversion reduces the sense of root-position closure. Mi is doubled between the outer voices.',
      evidence: [
        {
          id: 'c-int-mi-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: true,
          explanation: 'E is a tone of the C major triad and its bass in first inversion.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
      ],
    },
  ],
  descriptors: [
    {
      id: 'c-desc-closure',
      dimension: 'closure_strength',
      label: 'softens closure',
      explanation: 'Preserves tonic identity but avoids a root-position close.',
      evidenceIds: ['c-ev-1', 'c-ev-2'],
      source: 'curated',
    },
    {
      id: 'c-desc-motion',
      dimension: 'forward_motion',
      label: 'keeps the phrase open',
      explanation: 'This can support the end of a subphrase or stanza line that must continue.',
      evidenceIds: ['c-ev-2'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'c-ev-1',
      source: 'computed',
      featureId: 'final_inversion',
      value: 'first',
      explanation: 'The final tonic sounds in first inversion with the bass on mi.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
    {
      id: 'c-ev-2',
      source: 'rule',
      featureId: 'closure_inversion_rule',
      value: true,
      explanation: 'A first-inversion tonic keeps tonic function while weakening phrase-final closure.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 3,
  provenance: fixtureProvenance,
};

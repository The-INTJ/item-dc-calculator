/**
 * Candidate A — "Grounded descent" (spec §11.1 theme 1, Appendix A copy).
 * I held for the whole fragment; fa is a passing tone over sustained tonic.
 * Voicing: complete triad on beat 1 (C3–G3–E4–G4, doubled fifth); the
 * soprano/alto unison on E4 at beats 3–4 is deliberate — the alternative
 * (alto on C4) would leave beats 1–2 with no chord third.
 */

import type { CandidatePath } from '../../domain/analysis-types';
import { at, deg, pitch, W } from '../authoring';
import {
  cMajorTriad,
  FIXTURE_ID,
  fixtureProvenance,
  initialState,
  sopranoFromMelody,
} from './shared';

export const candidateA: CandidatePath = {
  id: 'grounded-descent',
  fixtureId: FIXTURE_ID,
  title: 'Grounded descent',
  summary: 'Hold tonic while fa passes through the soprano line.',
  tonalContext: initialState.tonalContext,
  phraseIntent: initialState.phraseIntent,
  harmonyEvents: [
    {
      id: 'a-harm-i',
      start: at(1, 1),
      duration: W,
      chord: cMajorTriad,
      analysis: {
        romanNumeral: 'I',
        scaleDegreeRoot: deg(1, 'do'),
        functionTags: ['tonic', 'tonic_prolongation'],
      },
      inversion: 0,
      bassPitch: pitch('C3'),
      displaySymbol: 'C',
    },
  ],
  voicing: {
    soprano: sopranoFromMelody('a'),
    alto: [
      {
        id: 'a-a-1',
        voice: 'alto',
        pitch: pitch('E4'),
        scaleDegree: deg(3, 'mi'),
        start: at(1, 1),
        duration: W,
        tieFromPrevious: false,
      },
    ],
    tenor: [
      {
        id: 'a-t-1',
        voice: 'tenor',
        pitch: pitch('G3'),
        scaleDegree: deg(5, 'sol'),
        start: at(1, 1),
        duration: W,
        tieFromPrevious: false,
      },
    ],
    bass: [
      {
        id: 'a-b-1',
        voice: 'bass',
        pitch: pitch('C3'),
        scaleDegree: deg(1, 'do'),
        start: at(1, 1),
        duration: W,
        tieFromPrevious: false,
      },
    ],
  },
  melodyInterpretations: [
    {
      melodyEventId: 'mel-sol',
      harmonyEventIds: ['a-harm-i'],
      role: 'chord_tone',
      explanation: 'Sol is the fifth of the tonic triad and needs no new harmony.',
      evidence: [
        {
          id: 'a-int-sol-1',
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
      harmonyEventIds: ['a-harm-i'],
      role: 'passing_tone',
      preparationEventId: 'mel-sol',
      resolutionEventId: 'mel-mi',
      explanation:
        'The melody moves sol–fa–mi while the underlying tonic remains in place. The fa is heard as a passing dissonance between two chord tones rather than as a demand for a separate chord.',
      evidence: [
        {
          id: 'a-int-fa-1',
          source: 'computed',
          featureId: 'chord_membership',
          value: false,
          explanation: 'F is not a tone of the C major triad.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'a-int-fa-2',
          source: 'computed',
          featureId: 'stepwise_motion',
          value: true,
          explanation: 'F is approached and left by descending step.',
          providerId: 'fixture',
          providerVersion: '0.1.0',
        },
        {
          id: 'a-int-fa-3',
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
      harmonyEventIds: ['a-harm-i'],
      role: 'chord_tone',
      explanation: 'Mi is the third of the tonic triad; the line settles back onto chord tones.',
      evidence: [
        {
          id: 'a-int-mi-1',
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
      id: 'a-desc-stability',
      dimension: 'stability',
      label: 'calm and grounded',
      explanation: 'The harmony remains on tonic while the melody moves through a passing dissonance.',
      evidenceIds: ['a-ev-1', 'a-ev-2'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'a-ev-1',
      source: 'computed',
      featureId: 'harmonic_rhythm',
      value: 'static',
      explanation: 'The harmony does not change across the fragment.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
    {
      id: 'a-ev-2',
      source: 'curated',
      featureId: 'stability_label',
      value: 'calm',
      explanation: 'The phrase remains harmonically stable.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 1,
  provenance: fixtureProvenance,
};

/**
 * Deterministic evidence minting for the engine, plus the stable featureId
 * catalog the ExplanationComposer reads. Every interpretive claim the engine
 * makes carries one of these ids — the machine-readable contract between the
 * math (which computes facts) and the knowledge layer (which turns facts into
 * beginner prose). Ids are derived from content; no Date, no crypto.
 */

import type { AnalysisEvidence, EvidenceSource } from '../analysis-types';

export const ENGINE_PROVIDER_ID = 'engine-core';
export const ENGINE_VERSION = '1.0.0';

/** Every featureId the engine can emit. Append-only across versions. */
export type EngineFeatureId =
  // chord identification
  | 'chord_identified'
  | 'chord_incomplete_triad'
  | 'chord_open_fifth'
  | 'chord_dyad'
  | 'chord_subset_reading'
  | 'chord_unknown'
  | 'chord_bass_root_preference'
  // key-relative reading
  | 'roman_numeral_reading'
  | 'chromatic_root'
  // melody / non-chord tones (slice 3)
  | 'nct_chord_tone'
  | 'nct_passing'
  | 'nct_neighbor'
  | 'nct_suspension'
  | 'nct_retardation'
  | 'nct_anticipation'
  | 'nct_appoggiatura'
  | 'nct_escape'
  | 'nct_pedal'
  | 'nct_ambiguous'
  // voice-leading facts (slice 3)
  | 'parallel_perfect_fifths'
  | 'parallel_octaves'
  | 'hidden_fifth_outer'
  | 'hidden_octave_outer'
  | 'voice_crossing'
  | 'voice_overlap'
  | 'spacing_sa_exceeded'
  | 'spacing_at_exceeded'
  | 'range_outer_warning'
  | 'range_exceeded'
  | 'doubled_leading_tone'
  | 'doubling_guideline'
  | 'leading_tone_unresolved'
  | 'seventh_unresolved'
  // generation / ranking (slice 5)
  | 'common_tone_sum'
  | 'raised_leading_tone'
  | 'cadence_reading'
  | 'retrogression'
  | 'lock_conflict'
  | 'approach_seam'
  // sanity
  | 'key_profile_mismatch'
  | 'analysis_rederived';

export function makeEvidence(
  idSeed: string,
  featureId: EngineFeatureId,
  value: boolean | number | string | string[],
  explanation: string,
  source: EvidenceSource = 'computed',
): AnalysisEvidence {
  return {
    id: idSeed,
    source,
    featureId,
    value,
    explanation,
    providerId: ENGINE_PROVIDER_ID,
    providerVersion: ENGINE_VERSION,
  };
}

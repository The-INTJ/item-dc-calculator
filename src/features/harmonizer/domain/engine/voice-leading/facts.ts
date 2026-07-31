/**
 * The voice-leading fact vocabulary — the observation ids the checker can
 * report and the shape each observation takes. Facts only; severity (including
 * "ignore entirely") comes exclusively from a style pack.
 */

import type { VoiceId } from '../../music-types';
import type { EngineFeatureId } from '../evidence';

export type VoiceLeadingFactId = Extract<
  EngineFeatureId,
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
  | 'leading_tone_unresolved'
  | 'seventh_unresolved'
>;

export interface VoiceLeadingFact {
  id: VoiceLeadingFactId;
  voices: VoiceId[];
  /** 0-based unit where the observation lands. */
  atUnit: number;
  detail: string;
}

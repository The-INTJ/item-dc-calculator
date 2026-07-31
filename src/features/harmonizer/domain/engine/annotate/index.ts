/**
 * The shared annotator — ONE analysis path for the user's surface and (from
 * slice 5) every generated candidate, so the cards and the workspace always
 * tell the same story. Composes segmentation → chord identity → key-relative
 * reading (harmony-events.ts) → melody interpretation (chord tones and
 * classified non-chord tones, seam-aware via the approach —
 * melody-interpretation.ts) → voice-leading facts → key sanity.
 *
 * Everything is deterministic and pure; every claim carries evidence.
 */

import type { AnalysisEvidence, MelodyInterpretation } from '../../analysis-types';
import type { ApproachContext } from '../../approach';
import type { HarmonyEvent, MelodyFragment, SATBVoicing, TonalContext } from '../../music-types';
import { makeEvidence } from '../evidence';
import { keySanityCheck } from '../key-sanity';
import { placedVoiceLines, segmentSurface } from '../segmentation';
import { checkVoiceLeading } from '../voice-leading';
import { buildHarmonyEvents } from './harmony-events';
import { interpretMelody } from './melody-interpretation';

export interface AnnotationResult {
  harmonyEvents: HarmonyEvent[];
  melodyInterpretations: MelodyInterpretation[];
  /** Candidate-level evidence: voice-leading facts, cadence readings, key sanity. */
  evidence: AnalysisEvidence[];
}

export function annotateVoicing(
  voicing: SATBVoicing,
  fragment: MelodyFragment,
  context: TonalContext,
  approach: ApproachContext | null,
  idPrefix: string,
): AnnotationResult {
  const lines = placedVoiceLines(voicing);
  const seamPitchClasses = approach
    ? Object.fromEntries(
        Object.entries(approach.voices).map(([voice, arrival]) => [
          voice,
          arrival.pitch.pitchClass,
        ]),
      )
    : {};
  const segments = segmentSurface(voicing, seamPitchClasses);
  const evidence: AnalysisEvidence[] = [];

  // ---- harmony events, with the cadential-6/4 sequence refinement ----
  const harmonyEvents = buildHarmonyEvents(segments, context, idPrefix, evidence);

  // ---- melody interpretations (seam-aware) ----
  const melodyInterpretations = interpretMelody(
    fragment,
    segments,
    harmonyEvents,
    approach,
    idPrefix,
  );

  // ---- candidate-level facts ----
  for (const fact of checkVoiceLeading(lines, segments, context)) {
    evidence.push(
      makeEvidence(
        `${idPrefix}-vl-${fact.id}-${fact.atUnit}-${fact.voices.join('')}`,
        fact.id,
        `${fact.voices.join('+')}@u${fact.atUnit}`,
        fact.detail,
      ),
    );
  }
  const sanity = keySanityCheck(voicing, context, `${idPrefix}-key-sanity`);
  if (sanity) evidence.push(sanity);

  return { harmonyEvents, melodyInterpretations, evidence };
}

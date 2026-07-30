/**
 * Key-change respelling — the note-preserving re-read that makes
 * EDIT_TONAL_CONTEXT safe. Every pitch stays byte-identical (letter,
 * accidental, octave, midi); ONLY the degree metadata (scaleDegree) and the
 * accepted seam's key-relative analysis are recomputed against the new
 * context. Out-of-key notes read honestly as chromatic degrees; nothing here
 * ever moves, respells, or transposes a note — the surface rule holds.
 */

import { reanalyzeStoredHarmony } from './engine/roman';
import type {
  MelodyFragment,
  SATBVoicing,
  TonalContext,
  VoiceEvent,
} from './music-types';
import { respellDegree } from './scale';
import type { CandidatePath } from './analysis-types';
import type { AcceptedContext } from './workbench-state';

function respellVoiceEvents(context: TonalContext, events: VoiceEvent[]): VoiceEvent[] {
  return events.map((event) => {
    const scaleDegree = respellDegree(context, event.pitch);
    return scaleDegree ? { ...event, scaleDegree } : event;
  });
}

export function respellVoicing(context: TonalContext, voicing: SATBVoicing): SATBVoicing {
  return {
    soprano: respellVoiceEvents(context, voicing.soprano),
    alto: respellVoiceEvents(context, voicing.alto),
    tenor: respellVoiceEvents(context, voicing.tenor),
    bass: respellVoiceEvents(context, voicing.bass),
  };
}

export function respellFragment(context: TonalContext, fragment: MelodyFragment): MelodyFragment {
  return {
    ...fragment,
    events: fragment.events.map((event) => {
      const scaleDegree = respellDegree(context, event.pitch);
      return scaleDegree ? { ...event, scaleDegree } : event;
    }),
  };
}

/** Voicing degrees re-read; analysis is NOT touched here — the working
 * reading re-derives via withDerivedAnalysis and the other cards are replaced
 * by regeneration. */
export function respellCandidate(context: TonalContext, candidate: CandidatePath): CandidatePath {
  return { ...candidate, voicing: respellVoicing(context, candidate.voicing) };
}

/**
 * The accepted seam re-read in the new key: the previous snippet's notes and
 * chord stay verbatim, but the numeral/degree reading they carry must speak
 * the new key (the chord you arrive from is I in C and IV in G).
 */
export function respellAccepted(
  context: TonalContext,
  accepted: AcceptedContext,
): AcceptedContext {
  const previousVoicing = accepted.previousVoicing
    ? respellVoicing(context, accepted.previousVoicing)
    : null;
  const previousHarmony = accepted.previousHarmony
    ? {
        ...accepted.previousHarmony,
        // Fresh analysis: appliedTo/borrowedFrom were readings in the OLD key
        // and do not survive a re-read.
        analysis: reanalyzeStoredHarmony(context, accepted.previousHarmony),
      }
    : null;
  return { previousHarmony, previousVoicing };
}

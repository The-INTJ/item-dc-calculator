/**
 * Shared plumbing for editing one voice of one candidate: swap a voice's
 * events into the SATB voicing, enforce the one-measure editor cap, and
 * mirror soprano edits onto the melody fragment (index correspondence).
 */

import type {
  MelodyEvent,
  MusicalTime,
  RationalDuration,
  SATBVoicing,
  VoiceEvent,
  VoiceId,
} from '../../domain/music-types';
import { UNITS_PER_MEASURE } from '../../domain/timing';
import { partEndUnits } from '../../domain/voice-editing';
import type { WorkbenchState } from '../../domain/workbench-state';

/* ---------- voice-edit helpers ---------- */

function withVoice(voicing: SATBVoicing, voice: VoiceId, events: VoiceEvent[]): SATBVoicing {
  return {
    soprano: voice === 'soprano' ? events : voicing.soprano,
    alto: voice === 'alto' ? events : voicing.alto,
    tenor: voice === 'tenor' ? events : voicing.tenor,
    bass: voice === 'bass' ? events : voicing.bass,
  };
}

/**
 * The one-measure editor cap: a part may shrink or rearrange freely but never
 * GROW past a measure; legacy content that already exceeds a measure keeps its
 * length editable in place. (4/4 assumption — see the meter ledger in
 * domain/timing.ts.)
 */
export function measureCap(events: { id: string; start: MusicalTime; duration: RationalDuration }[]): number {
  return Math.max(UNITS_PER_MEASURE, partEndUnits(events));
}

export interface VoiceEditResult {
  candidates: WorkbenchState['candidates'];
  fragment: WorkbenchState['fragment'];
}

/**
 * Apply an edit to one voice of one candidate; soprano edits mirror onto the
 * melody fragment (index correspondence). Null = no-op.
 */
export function editVoice(
  state: WorkbenchState,
  candidateId: string,
  voice: VoiceId,
  editEvents: (events: VoiceEvent[]) => VoiceEvent[] | null,
  editMelody: (events: MelodyEvent[]) => MelodyEvent[] | null,
): VoiceEditResult | null {
  const index = state.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index === -1) return null;
  const candidate = state.candidates[index];
  const edited = editEvents(candidate.voicing[voice]);
  if (!edited) return null;
  const voicing = withVoice(candidate.voicing, voice, edited);
  const candidates = state.candidates.map((entry, i) =>
    i === index ? { ...entry, voicing } : entry,
  );
  let fragment = state.fragment;
  if (voice === 'soprano') {
    const melodyEvents = editMelody(state.fragment.events);
    if (melodyEvents) fragment = { ...state.fragment, events: melodyEvents };
  }
  return { candidates, fragment };
}

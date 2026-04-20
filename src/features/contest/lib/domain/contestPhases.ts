/**
 * @deprecated Import from `matchupPhases` instead. This file re-exports the
 * matchup-phase symbols under their legacy names so older call sites still
 * compile during the matchup refactor; it will be removed in PR 8.
 */
import {
  MATCHUP_PHASE_VALUES,
  matchupPhaseLabels,
  matchupPhaseDescriptions,
} from './matchupPhases';

export const PHASE_VALUES = MATCHUP_PHASE_VALUES;
export const phaseLabels = matchupPhaseLabels;
export const phaseDescriptions = matchupPhaseDescriptions;

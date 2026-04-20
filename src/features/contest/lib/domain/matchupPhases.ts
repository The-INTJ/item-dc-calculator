import type { MatchupPhase } from '../../contexts/contest/contestTypes';

export const MATCHUP_PHASE_VALUES: MatchupPhase[] = ['set', 'shake', 'scored'];

export const matchupPhaseLabels: Record<MatchupPhase, string> = {
  set: 'Set',
  shake: 'Shake',
  scored: 'Scored',
};

export const matchupPhaseDescriptions: Record<MatchupPhase, string> = {
  set: 'Slot assigned. Scoring not yet open.',
  shake: 'Scoring open — voters may submit.',
  scored: 'Scoring closed. Winner determined.',
};

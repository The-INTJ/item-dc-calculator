import type { ContestPhase } from '../../contexts/contest/contestTypes';

export const PHASE_VALUES: ContestPhase[] = ['set', 'shake', 'scored'];

export const phaseLabels: Record<ContestPhase, string> = {
  set: 'Set',
  shake: 'Shake',
  scored: 'Scored',
};

export const phaseDescriptions: Record<ContestPhase, string> = {
  set: 'Preparation phase. Participants joining.',
  shake: 'Active phase. Judging is open.',
  scored: 'Scoring closed. Results are being tallied.',
};

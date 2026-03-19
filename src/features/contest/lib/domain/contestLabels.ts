import type { ContestConfig } from '../../contexts/contest/contestTypes';

export function getContestantLabel(config?: ContestConfig): string {
  return config?.contestantLabel || 'Contestant';
}

export function getContestantLabelPlural(config?: ContestConfig): string {
  return config?.contestantLabelPlural || 'Contestants';
}

export function getEntryLabel(config?: ContestConfig): string {
  return config?.entryLabel || 'Entry';
}

export function getEntryLabelPlural(config?: ContestConfig): string {
  return config?.entryLabelPlural || 'Entries';
}

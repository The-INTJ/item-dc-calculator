import type { Entry } from '../../../contexts/contest/contestTypes';
import { generateId as makeId } from '../../backend/providerUtils';

/**
 * Build inline matchup entries from contestant ids. Entry ids are stable so
 * vote docs can reference them and aggregate updates can find the slot.
 */
export function buildInlineEntriesFromContestantIds(
  matchupId: string,
  contestantIds: string[],
): Entry[] {
  return contestantIds.map((contestantId) => ({
    id: makeId('entry'),
    contestantId,
    matchupId,
    name: '',
    sumScore: 0,
    voteCount: 0,
  }));
}

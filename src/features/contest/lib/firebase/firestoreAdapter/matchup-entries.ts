import type { Entry } from '../../../contexts/contest/contestTypes';
import type { MatchupCreateInput } from '../../backend/types';
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

/**
 * Resolve a create input into the id, inline entries, and remaining fields a
 * new matchup doc is written from. Shared by the single and batch create
 * paths so both derive entry ids the same way.
 */
export function prepareNewMatchup(input: MatchupCreateInput): {
  id: string;
  entries: Entry[];
  rest: Omit<MatchupCreateInput, 'id' | 'contestantIds' | 'entries'>;
} {
  const id = input.id ?? makeId('matchup');
  const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
  void _ignored;

  const entries = providedEntries
    ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);

  return { id, entries, rest };
}

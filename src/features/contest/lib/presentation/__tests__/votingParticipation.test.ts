import { describe, expect, it } from 'vitest';
import {
  computeVotedRoundCount,
  getRoundVotingParticipation,
} from '../votingParticipation';
import type { Matchup, ScoreEntry } from '../../../contexts/contest/contestTypes';

describe('getRoundVotingParticipation', () => {
  it('counts votable matchups and voted matchups', () => {
    const round = {
      matchups: [
        { matchupId: 'm-1' },
        { matchupId: 'm-2' },
        { matchupId: 'm-3' },
      ],
    };
    const result = getRoundVotingParticipation(round, new Set(['m-1', 'm-3']));
    expect(result).toEqual({ votable: 3, voted: 2 });
  });

  it('excludes byes and placeholder slots', () => {
    const round = {
      matchups: [
        { matchupId: 'm-1' },
        { matchupId: 'm-bye', isBye: true },
        { matchupId: undefined },
      ],
    };
    const result = getRoundVotingParticipation(round, new Set<string>());
    expect(result).toEqual({ votable: 1, voted: 0 });
  });

  it('handles empty rounds', () => {
    expect(getRoundVotingParticipation({ matchups: [] }, new Set())).toEqual({
      votable: 0,
      voted: 0,
    });
  });
});

function score(userId: string, matchupId: string, entryId: string): ScoreEntry {
  return { id: `${userId}_${matchupId}_${entryId}`, userId, matchupId, entryId, breakdown: {} };
}

function matchup(id: string, roundId: string): Matchup {
  return { id, contestId: 'contest-1', roundId, slotIndex: 0, entries: [], phase: 'scored' };
}

describe('computeVotedRoundCount', () => {
  const rounds = [
    { id: 'round-1', name: 'Round 1' },
    { id: 'round-2', name: 'Round 2' },
  ];
  const matchups = [
    matchup('m-1', 'round-1'),
    matchup('m-2', 'round-1'),
    matchup('m-3', 'round-2'),
  ];

  it('counts distinct rounds the user voted in', () => {
    const scores = [
      score('user-1', 'm-1', 'e-1'),
      score('user-1', 'm-2', 'e-2'), // same round — still 1
      score('user-1', 'm-3', 'e-3'),
      score('user-2', 'm-1', 'e-1'), // different user
    ];
    expect(computeVotedRoundCount('user-1', scores, matchups, rounds)).toBe(2);
  });

  it('ignores votes on matchups from unknown rounds', () => {
    const scores = [score('user-1', 'm-ghost', 'e-1')];
    expect(computeVotedRoundCount('user-1', scores, matchups, rounds)).toBe(0);
  });

  it('returns null for users without a linked account', () => {
    expect(computeVotedRoundCount(null, [], matchups, rounds)).toBeNull();
    expect(computeVotedRoundCount(undefined, [], matchups, rounds)).toBeNull();
  });
});

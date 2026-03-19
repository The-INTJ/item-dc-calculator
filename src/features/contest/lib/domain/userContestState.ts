import type { Contest } from '../../contexts/contest/contestTypes';

export type UserContestRole = 'spectator' | 'voter' | 'contestant';

/**
 * Derives the user's role in a contest from the voters list.
 * - spectator: not in voters (hasn't voted or registered)
 * - voter: in voters with role 'voter' or 'admin'
 * - contestant: in voters with role 'competitor'
 */
export function getUserContestRole(userId: string | null, contest: Contest): UserContestRole {
  if (!userId) return 'spectator';
  const voter = contest.voters.find((v) => v.id === userId);
  if (!voter) return 'spectator';
  if (voter.role === 'competitor') return 'contestant';
  return 'voter';
}

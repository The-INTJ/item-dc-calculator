import type { UserProfile } from '../../contexts/auth/types';
import type { Contest, UserRole } from '../../contexts/contest/contestTypes';

export type HomepageContestStatus = 'active' | 'pending' | 'closed';

export interface HomepageWelcome {
  displayName: string;
}

export interface HomepageLiveBanner {
  contestId: string;
  contestName: string;
  ctaLabel: string;
  ctaHref: string;
  roundCount: number;
  entryCount: number;
}

export interface HomepageContestRow {
  id: string;
  name: string;
  href: string;
  initials: string;
  roundCount: number;
  contestantCount: number;
  statusBadge: { label: string; variant: HomepageContestStatus } | null;
}

export interface HomepageView {
  welcome: HomepageWelcome | null;
  liveBanner: HomepageLiveBanner | null;
  contests: HomepageContestRow[];
}

export interface BuildHomepageViewInput {
  contests: Contest[];
  user: UserProfile | null;
  role: UserRole | null;
  visitedContestIds: ReadonlySet<string>;
}

function getContestStatus(contest: Contest): HomepageContestStatus {
  if (contest.defaultContest || contest.currentEntryId) return 'active';
  if (
    (contest.contestants?.length ?? 0) === 0 ||
    (contest.rounds?.length ?? 0) === 0
  ) {
    return 'pending';
  }
  return 'pending';
}

function statusLabel(status: HomepageContestStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  return 'Pending';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildHomepageView({
  contests,
  user,
  role,
  visitedContestIds,
}: BuildHomepageViewInput): HomepageView {
  const isAdmin = role === 'admin';

  const welcome: HomepageWelcome | null = user
    ? { displayName: user.displayName }
    : null;

  const contestById = new Map(contests.map((contest) => [contest.id, contest]));
  let lastVisited: Contest | null = null;
  if (user) {
    const visitedIds = Array.from(visitedContestIds);
    for (let i = visitedIds.length - 1; i >= 0; i--) {
      const found = contestById.get(visitedIds[i]);
      if (found) {
        lastVisited = found;
        break;
      }
    }
  }

  const liveBanner: HomepageLiveBanner | null = lastVisited
    ? {
        contestId: lastVisited.id,
        contestName: lastVisited.name,
        ctaLabel: `Go to ${lastVisited.name}`,
        ctaHref: `/contest/${lastVisited.id}`,
        roundCount: lastVisited.rounds?.length ?? 0,
        entryCount: lastVisited.contestants?.length ?? 0,
      }
    : null;

  const rows: HomepageContestRow[] = contests.map((contest) => {
    const status = getContestStatus(contest);
    return {
      id: contest.id,
      name: contest.name,
      href: `/contest/${contest.id}`,
      initials: initials(contest.name),
      roundCount: contest.rounds?.length ?? 0,
      contestantCount: contest.contestants?.length ?? 0,
      statusBadge: isAdmin
        ? { label: statusLabel(status), variant: status }
        : null,
    };
  });

  return { welcome, liveBanner, contests: rows };
}

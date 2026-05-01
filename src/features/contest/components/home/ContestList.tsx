'use client';

import Link from 'next/link';
import type { UserProfile } from '@/contest/contexts/auth/types';
import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import type { Contest } from '@/contest/contexts/contest/contestTypes';
import FeaturedContestCard from './FeaturedContestCard';

interface ContestListProps {
  featuredContestId?: string;
  user?: UserProfile | null;
}

type ContestStatus = 'active' | 'pending' | 'closed';

function getContestStatus(contest: Contest): ContestStatus {
  if (contest.defaultContest || contest.currentEntryId) return 'active';
  if ((contest.entries?.length ?? 0) === 0 || (contest.rounds?.length ?? 0) === 0) return 'pending';

  const voteCount = contest.entries.reduce((sum, entry) => sum + (entry.voteCount ?? 0), 0);
  return voteCount > 0 ? 'closed' : 'pending';
}

function statusLabel(status: ContestStatus) {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  return 'Pending';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ContestList({ featuredContestId, user }: ContestListProps) {
  const { contests } = useContestStore();

  if (featuredContestId) {
    const featured = contests.find(
      (contest) => contest.id === featuredContestId || contest.slug === featuredContestId,
    );

    if (!featured) {
      return (
        <div className="contest-list">
          <p className="contest-empty">Contest not found.</p>
        </div>
      );
    }

    return <FeaturedContestCard contest={featured} />;
  }

  const liveContest = contests.find((contest) => getContestStatus(contest) === 'active') ?? contests[0] ?? null;
  const liveRoundCount = liveContest?.rounds?.length ?? 0;
  const liveEntryCount = liveContest?.entries?.length ?? 0;

  return (
    <div className="contest-home">
      {user && (
        <section className="contest-hero contest-home__hero">
          <p className="eyebrow contest-home__eyebrow">Welcome back</p>
          <h1>
            <span>{user.displayName}</span>
          </h1>
          <p>
            {liveContest
              ? `${contests.length} contest${contests.length === 1 ? '' : 's'} available. ${liveRoundCount} round${liveRoundCount === 1 ? '' : 's'} ready to track.`
              : 'No contests are live yet. Check back when the host opens one.'}
          </p>
          <div className="contest-actions">
            {liveContest ? (
              <Link href={`/contest/${liveContest.id}`} className="btn btn--sm contest-home__hero-primary">
                Join {liveContest.name}
              </Link>
            ) : null}
            <a href="#contest-list" className="btn btn--sm btn--tertiary contest-home__hero-secondary">
              Browse all
            </a>
          </div>
        </section>
      )}

      {liveContest && (
        <section className="contest-live-card">
          <div className="contest-live-card__topline">
            <span className="contest-live-card__label">
              <span className="live-dot" aria-hidden="true" />
              Live now
            </span>
            <span className="badge badge--scoring badge--dot">Scoring</span>
          </div>
          <h2>{liveContest.name}</h2>
          <p>
            {liveRoundCount} rounds / {liveEntryCount} entries / Live updates
          </p>
          <Link href={`/contest/${liveContest.id}`} className="btn btn--accent btn--block">
            Score Round 1
          </Link>
        </section>
      )}

      <section className="contest-list" id="contest-list">
        <div className="contest-list__header">
          <h2>Contests</h2>
          <span className="muted">{contests.length}</span>
        </div>
        {contests.length === 0 ? (
          <p className="contest-empty">No contests are available yet.</p>
        ) : (
          <ul className="contest-list__items">
            {contests.map((contest) => {
              const status = getContestStatus(contest);
              return (
                <li key={contest.id}>
                  <Link href={`/contest/${contest.id}`} className="contest-list-row">
                    <span className="contest-list-row__avatar" aria-hidden="true">
                      {initials(contest.name)}
                    </span>
                    <span className="contest-list-row__body">
                      <span className="contest-list-row__name">{contest.name}</span>
                      <span className="contest-list-row__meta">
                        {(contest.rounds?.length ?? 0)} rounds / {(contest.entries?.length ?? 0)} entries
                      </span>
                    </span>
                    <span className={`contest-status-badge contest-status-badge--${status}`}>
                      {statusLabel(status)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { UserProfile } from '@/contest/contexts/auth/types';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import { useVisitedContests } from '@/contest/lib/hooks/useVisitedContests';
import { buildHomepageView } from '@/contest/lib/presentation/buildHomepageView';
import FeaturedContestCard from './FeaturedContestCard';
import WelcomeBanner from './WelcomeBanner';
import LiveBanner from './LiveBanner';
import ContestRow from './ContestRow';

interface ContestListProps {
  featuredContestId?: string;
  user?: UserProfile | null;
}

export default function ContestList({ featuredContestId, user }: ContestListProps) {
  const { contests } = useContestStore();
  const { role } = useAuth();
  const visitedContestIds = useVisitedContests();

  const view = useMemo(
    () =>
      buildHomepageView({
        contests,
        user: user ?? null,
        role,
        visitedContestIds,
      }),
    [contests, user, role, visitedContestIds],
  );

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

  return (
    <div className="contest-home">
      {view.welcome && <WelcomeBanner welcome={view.welcome} />}
      {view.liveBanner && <LiveBanner banner={view.liveBanner} />}

      <section className="contest-list" id="contest-list">
        <div className="contest-list__header">
          <h2>Contests</h2>
          <span className="muted">{view.contests.length}</span>
        </div>
        {view.contests.length === 0 ? (
          <p className="contest-empty">No contests are available yet.</p>
        ) : (
          <ul className="contest-list__items">
            {view.contests.map((row) => (
              <ContestRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

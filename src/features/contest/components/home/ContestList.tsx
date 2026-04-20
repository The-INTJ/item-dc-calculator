'use client';

import Link from 'next/link';
import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import FeaturedContestCard from './FeaturedContestCard';
import styles from './ContestList.module.scss';

interface ContestListProps {
  featuredContestId?: string;
}

export default function ContestList({ featuredContestId }: ContestListProps) {
  const { contests } = useContestStore();

  if (featuredContestId) {
    const featured = contests.find(
      (c) => c.id === featuredContestId || c.slug === featuredContestId,
    );

    if (!featured) {
      return (
        <div className={styles.container}>
          <p>Contest not found.</p>
        </div>
      );
    }

    return <FeaturedContestCard contest={featured} />;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Contests</h2>
      <ul className={styles.list}>
        {contests.map((contest) => (
          <li key={contest.id}>
            <Link href={`/contest/${contest.id}`} className={styles.item}>
              <span className={styles.contestName}>{contest.name}</span>
              <span className={styles.meta}>
                {(contest.rounds?.length ?? 0)} rounds · {(contest.entries?.length ?? 0)} entries
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import Link from 'next/link';
import type { Contest } from '@/contest/contexts/contest/contestTypes';
import styles from './FeaturedContestCard.module.scss';

interface FeaturedContestCardProps {
  contest: Contest;
}

export default function FeaturedContestCard({ contest }: FeaturedContestCardProps) {
  const roundCount = contest.rounds?.length ?? 0;
  const entryCount = contest.entries?.length ?? 0;

  return (
    <div className={styles.card}>
      <h1 className={styles.name}>{contest.name}</h1>
      {contest.config?.topic && (
        <p className={styles.topic}>{contest.config.topic}</p>
      )}
      <span className={styles.meta}>
        {entryCount} contestants · {roundCount} rounds
      </span>
      <Link href={`/contest/${contest.id}`} className={styles.cta}>
        View Contest
      </Link>
    </div>
  );
}

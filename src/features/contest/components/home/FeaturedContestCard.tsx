'use client';

import Link from 'next/link';
import type { Contest } from '@/contest/contexts/contest/contestTypes';
import styles from './FeaturedContestCard.module.scss';

interface FeaturedContestCardProps {
  contest: Contest;
}

export default function FeaturedContestCard({ contest }: FeaturedContestCardProps) {
  return (
    <div className={styles.card}>
      <h1 className={styles.name}>{contest.name}</h1>
      {contest.config?.topic && (
        <p className={styles.topic}>{contest.config.topic}</p>
      )}
      <span className={styles.phaseBadge} data-phase={contest.phase}>
        {contest.phase}
      </span>
      <Link href={`/contest/${contest.id}`} className={styles.cta}>
        View Contest
      </Link>
    </div>
  );
}

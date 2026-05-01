'use client';

import Link from 'next/link';
import type { Contest } from '@/contest/contexts/contest/contestTypes';
import styles from './FeaturedContestCard.module.scss';

interface FeaturedContestCardProps {
  contest: Contest;
}

export default function FeaturedContestCard({ contest }: FeaturedContestCardProps) {
  const roundCount = contest.rounds?.length ?? 0;
  const contestantCount = contest.contestants?.length ?? 0;

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Featured contest</p>
      <h1 className={styles.name}>{contest.name}</h1>
      {contest.config?.topic && <p className={styles.topic}>{contest.config.topic}</p>}
      <span className={styles.meta}>
        {contestantCount} contestants / {roundCount} rounds
      </span>
      <Link href={`/contest/${contest.id}`} className={styles.cta}>
        View Contest
      </Link>
    </div>
  );
}

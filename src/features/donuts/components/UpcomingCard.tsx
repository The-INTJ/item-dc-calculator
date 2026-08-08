'use client';

import { describeAssignment } from '../lib/presentation';
import { formatLongDate } from '../lib/sundays';
import type { ResolvedSunday } from '../lib/types';

import styles from './DonutsView.module.scss';

interface UpcomingCardProps {
  sunday: ResolvedSunday;
  isToday: boolean;
  busy: boolean;
  onDecline: () => void;
  onVolunteer: () => void;
}

/** The headline answer: who is bringing donuts this Sunday. */
export function UpcomingCard({
  sunday,
  isToday,
  busy,
  onDecline,
  onVolunteer,
}: UpcomingCardProps) {
  return (
    <section className={styles.hero}>
      <p className={styles.heroLabel}>{isToday ? 'Donuts today' : 'Donuts this Sunday'}</p>
      <p className={styles.heroName}>{sunday.personName}</p>
      <p className={styles.heroDate}>{formatLongDate(sunday.date)}</p>
      <p className={styles.heroWhy}>{describeAssignment(sunday)}</p>
      <div className={styles.heroActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onDecline}
          disabled={busy}
        >
          I cannot do it
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onVolunteer}
          disabled={busy}
        >
          {sunday.personId
            ? `I can do it instead (replaces ${sunday.personName})`
            : 'I can do it'}
        </button>
      </div>
    </section>
  );
}

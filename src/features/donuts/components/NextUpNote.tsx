'use client';

import { formatShortDate } from '../lib/sundays';
import type { ResolvedSunday } from '../lib/types';

import styles from './DonutsView.module.scss';

/** Deliberately quiet: the Sunday after next is context, not the headline. */
export function NextUpNote({ sunday }: { sunday: ResolvedSunday }) {
  return (
    <p className={styles.nextUp}>
      <span>Then {formatShortDate(sunday.date)}:</span>
      <span className={styles.nextUpName}>{sunday.personName}</span>
    </p>
  );
}

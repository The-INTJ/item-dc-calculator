'use client';

import { describeLogEntry } from '../lib/presentation';
import type { DonutLogEntry } from '../lib/types';

import styles from './DonutsView.module.scss';

const VISIBLE = 6;

/** A short tail of the history log so swaps are visible without an admin trip. */
export function RecentSwaps({ log }: { log: DonutLogEntry[] }) {
  const entries = [...log].sort((a, b) => b.at - a.at).slice(0, VISIBLE);
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={styles.logSection}>
      <h2 className={styles.logHeading}>Recent changes</h2>
      <ul className={styles.logList}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.logItem}>
            {describeLogEntry(entry)}
            {entry.reason && <span className={styles.logReason}> — “{entry.reason}”</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

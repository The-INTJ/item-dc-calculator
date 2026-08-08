'use client';

import { describeLogEntry } from '../../lib/presentation';
import type { DonutLogEntry } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';

const VISIBLE = 40;

/** The full audit trail — every swap, override and clear, newest first. */
export function AdminLog({ log }: { log: DonutLogEntry[] }) {
  const entries = [...log].sort((a, b) => b.at - a.at).slice(0, VISIBLE);

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>History</h2>
      {entries.length === 0 ? (
        <p className={styles.muted}>Nothing logged yet.</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.listItem}>
              {describeLogEntry(entry)}
              {entry.reason && <span className={styles.muted}> — “{entry.reason}”</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

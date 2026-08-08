'use client';

import { donutsApi } from '../../lib/api/donutsApi';
import { formatLongDate } from '../../lib/sundays';
import type { DonutBoard } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';
import { OverrideForm } from './OverrideForm';
import type { RunMutation } from './useDonutsAdmin';

interface OverridesEditorProps {
  board: DonutBoard;
  busy: boolean;
  run: RunMutation;
}

/** One-off assignments for any date, listed oldest first. */
export function OverridesEditor({ board, busy, run }: OverridesEditorProps) {
  const overrides = [...board.overrides].sort((a, b) => a.date.localeCompare(b.date));
  const nameOf = (id: string) =>
    board.people.find((person) => person.id === id)?.name ?? 'Someone (removed)';

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>One-off overrides</h2>
      <p className={styles.cardHint}>
        For occasional helpers like Will. An override beats the base rotation on that date
        and nothing else about the rotation shifts.
      </p>

      <OverrideForm people={board.people} busy={busy} run={run} />

      {overrides.length === 0 ? (
        <p className={styles.muted}>No overrides on the books.</p>
      ) : (
        <ul className={styles.list}>
          {overrides.map((entry) => (
            <li key={entry.id} className={styles.row}>
              <span className={styles.grow}>
                <strong>{formatLongDate(entry.date)}</strong> — {nameOf(entry.personId)}
                {entry.note && <span className={styles.muted}> · {entry.note}</span>}
              </span>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonDanger}`}
                disabled={busy}
                onClick={() => void run(() => donutsApi.removeOverride(entry.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

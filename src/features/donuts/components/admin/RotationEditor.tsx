'use client';

import { donutsApi } from '../../lib/api/donutsApi';
import { formatOrdinal } from '../../lib/sundays';
import type { DonutPerson, SundayOrdinal } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';
import type { RunMutation } from './useDonutsAdmin';

interface RotationEditorProps {
  rotation: (string | null)[];
  people: DonutPerson[];
  busy: boolean;
  run: RunMutation;
}

/** The base rotation: one person per ordinal Sunday, 1st through 5th. */
export function RotationEditor({ rotation, people, busy, run }: RotationEditorProps) {
  function setSlot(index: number, personId: string) {
    const next = [...rotation];
    next[index] = personId === '' ? null : personId;
    void run(() => donutsApi.setRotation(next));
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Base rotation</h2>
      <p className={styles.cardHint}>
        Months with five Sundays use the 5th slot; months without one simply skip it.
      </p>
      <div className={styles.rows}>
        {rotation.map((personId, index) => (
          <div className={styles.row} key={index}>
            <span className={styles.rowLabel}>
              {formatOrdinal((index + 1) as SundayOrdinal)}
            </span>
            <select
              className={`${styles.select} ${styles.grow}`}
              value={personId ?? ''}
              disabled={busy}
              onChange={(event) => setSlot(index, event.target.value)}
              aria-label={`Person for the ${formatOrdinal((index + 1) as SundayOrdinal)}`}
            >
              <option value="">— nobody —</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                  {person.active ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

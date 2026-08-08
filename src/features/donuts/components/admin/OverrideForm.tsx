'use client';

import { useState } from 'react';

import { donutsApi } from '../../lib/api/donutsApi';
import { isSunday } from '../../lib/sundays';
import type { DonutPerson } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';
import type { RunMutation } from './useDonutsAdmin';

interface OverrideFormProps {
  people: DonutPerson[];
  busy: boolean;
  run: RunMutation;
}

/** Assign any Sunday to anyone, including dates past the ten-week outlook. */
export function OverrideForm({ people, busy, run }: OverrideFormProps) {
  const [date, setDate] = useState('');
  const [personId, setPersonId] = useState('');
  const [note, setNote] = useState('');

  const dateInvalid = date !== '' && !isSunday(date);
  const canSubmit = date !== '' && !dateInvalid && personId !== '';

  async function add() {
    const ok = await run(() =>
      donutsApi.addOverride({ date, personId, note: note.trim() || undefined }),
    );
    if (ok) {
      setDate('');
      setPersonId('');
      setNote('');
    }
  }

  return (
    <>
      <div className={styles.inlineForm}>
        <label className={styles.field}>
          Sunday
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          Person
          <select
            className={styles.select}
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            <option value="">Choose…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
          Note (optional)
          <input
            className={styles.input}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
          />
        </label>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={busy || !canSubmit}
          onClick={() => void add()}
        >
          Add
        </button>
      </div>
      {dateInvalid && <p className={styles.error}>Pick a Sunday.</p>}
    </>
  );
}

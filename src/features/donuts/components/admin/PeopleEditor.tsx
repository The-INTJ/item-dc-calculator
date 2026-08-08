'use client';

import { useState } from 'react';

import { donutsApi } from '../../lib/api/donutsApi';
import type { DonutPerson } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';
import type { RunMutation } from './useDonutsAdmin';

interface PeopleEditorProps {
  people: DonutPerson[];
  busy: boolean;
  run: RunMutation;
}

function PersonRow({ person, busy, run }: { person: DonutPerson } & Omit<PeopleEditorProps, 'people'>) {
  const [name, setName] = useState(person.name);

  return (
    <div className={styles.row}>
      <input
        className={`${styles.input} ${styles.grow}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== person.name) {
            void run(() => donutsApi.updatePerson(person.id, { name: trimmed }));
          } else {
            setName(person.name);
          }
        }}
        aria-label={`Name for ${person.name}`}
        maxLength={60}
      />
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={person.active}
          disabled={busy}
          onChange={(event) =>
            void run(() => donutsApi.updatePerson(person.id, { active: event.target.checked }))
          }
        />
        Active
      </label>
      <button
        type="button"
        className={`${styles.button} ${styles.buttonDanger}`}
        disabled={busy}
        onClick={() => void run(() => donutsApi.removePerson(person.id))}
      >
        Remove
      </button>
    </div>
  );
}

/** Add, rename, stand down, or remove people. Inactive people keep their slot. */
export function PeopleEditor({ people, busy, run }: PeopleEditorProps) {
  const [draft, setDraft] = useState('');

  async function addPerson() {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    if (await run(() => donutsApi.addPerson(trimmed))) {
      setDraft('');
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>People</h2>
      <p className={styles.cardHint}>
        Unchecking <em>Active</em> keeps someone on the board but skips their turns — their
        slot gets covered by the other regulars in turn.
      </p>
      <div className={styles.rows}>
        {people.map((person) => (
          <PersonRow key={person.id} person={person} busy={busy} run={run} />
        ))}
      </div>
      <div className={styles.inlineForm}>
        <label className={`${styles.field} ${styles.grow}`}>
          Add someone
          <input
            className={styles.input}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Name"
            maxLength={60}
          />
        </label>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={busy || draft.trim() === ''}
          onClick={() => void addPerson()}
        >
          Add
        </button>
      </div>
    </section>
  );
}

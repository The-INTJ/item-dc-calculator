'use client';

import { formatDaysAgo, formatVibe } from '../lib/format';
import type { PlantEvent } from '../lib/types';
import styles from './PlantCard.module.scss';
import type { usePlantJournal } from './plantCardActions';

type PlantJournal = ReturnType<typeof usePlantJournal>;

interface PlantNotesSectionProps {
  notes: PlantEvent[];
  now: number;
  journal: PlantJournal;
}

export function PlantNotesSection({ notes, now, journal }: PlantNotesSectionProps) {
  return (
    <section>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionLabel}>Notes</h3>
        <button
          type="button"
          className={styles.inlineButton}
          onClick={() => journal.setShowAllNotes((value) => !value)}
          disabled={notes.length === 0}
        >
          {journal.showAllNotes ? 'Hide notes' : `Show all notes (${notes.length})`}
        </button>
      </div>
      <form className={styles.noteForm} onSubmit={journal.submitNote}>
        <textarea
          className={styles.noteInput}
          value={journal.noteDraft}
          onChange={(event) => journal.setNoteDraft(event.target.value)}
          placeholder="Leaf curl, new growth, pests, spray mix..."
          maxLength={2000}
          rows={3}
          aria-label="Plant note"
        />
        <div className={styles.noteActions}>
          <span className={styles.noteCount}>{journal.noteDraft.length}/2000</span>
          <button type="submit" className={styles.textButton} disabled={journal.noteSaving}>
            {journal.noteSaving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
      {journal.showAllNotes && notes.length > 0 && (
        <ul className={styles.noteList}>
          {notes.map((event) => (
            <li key={event.id} className={styles.noteRow}>
              <span className={styles.noteWhen} title={new Date(event.at).toLocaleString()}>
                {formatDaysAgo(event.at, now)}
              </span>
              <span className={styles.noteText}>{event.note ?? ''}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface PlantVibeSectionProps {
  lastVibeRating: number | null;
  journal: PlantJournal;
}

export function PlantVibeSection({ lastVibeRating, journal }: PlantVibeSectionProps) {
  return (
    <section>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionLabel}>Vibe</h3>
        <span className={styles.latestVibe}>
          Latest {formatVibe(lastVibeRating)}
        </span>
      </div>
      <form className={styles.vibeForm} onSubmit={journal.submitVibe}>
        <label className={styles.vibePill}>
          <input
            className={styles.vibeInput}
            value={journal.vibeDraft}
            onChange={(event) => journal.setVibeDraft(event.target.value)}
            type="number"
            min={0}
            max={10}
            inputMode="numeric"
            aria-label="Plant vibe rating"
          />
          <span className={styles.vibeSuffix}>/10</span>
        </label>
        <button type="submit" className={styles.textButton} disabled={journal.vibeSaving}>
          {journal.vibeSaving ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}

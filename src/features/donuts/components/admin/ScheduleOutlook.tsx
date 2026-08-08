'use client';

import { donutsApi } from '../../lib/api/donutsApi';
import { simulate } from '../../lib/schedule';
import { addWeeks, formatShortDate, formatOrdinal, todayIso, upcomingSunday } from '../../lib/sundays';
import type { DonutBoard, IsoDate, ResolvedSunday } from '../../lib/types';

import styles from './DonutsAdmin.module.scss';
import type { RunMutation } from './useDonutsAdmin';

const WEEKS_AHEAD = 10;

interface ScheduleOutlookProps {
  board: DonutBoard;
  busy: boolean;
  run: RunMutation;
}

function sourceBadge(sunday: ResolvedSunday): { label: string; cover: boolean } | null {
  if (sunday.source === 'override') return { label: 'one-off', cover: false };
  if (sunday.source === 'cover') return { label: `covering ${sunday.coveringForName}`, cover: true };
  if (sunday.source === 'fill') return { label: 'filling in', cover: true };
  return null;
}

/** The next ten Sundays, each directly reassignable. */
export function ScheduleOutlook({ board, busy, run }: ScheduleOutlookProps) {
  const start = upcomingSunday(todayIso());
  const horizon = addWeeks(start, WEEKS_AHEAD - 1);
  const upcoming = simulate(board, horizon).sundays.filter((day) => day.date >= start);
  const overrideDates = new Set(board.overrides.map((entry) => entry.date));

  function assign(date: IsoDate, personId: string) {
    if (personId) {
      void run(() => donutsApi.addOverride({ date, personId }));
    }
  }

  function clear(date: IsoDate) {
    const target = board.overrides.find((entry) => entry.date === date);
    if (target) {
      void run(() => donutsApi.removeOverride(target.id));
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Next {WEEKS_AHEAD} Sundays</h2>
      <p className={styles.cardHint}>
        Changing a name here writes a one-off override for that date. Clearing it hands the
        date back to the base rotation.
      </p>
      <div className={styles.rows}>
        {upcoming.map((day) => {
          const badge = sourceBadge(day);
          return (
            <div className={styles.row} key={day.date}>
              <span className={styles.rowLabel}>{formatShortDate(day.date)}</span>
              <span className={styles.badge}>{formatOrdinal(day.ordinal)}</span>
              <select
                className={`${styles.select} ${styles.grow}`}
                value={day.personId ?? ''}
                disabled={busy}
                onChange={(event) => assign(day.date, event.target.value)}
                aria-label={`Who brings donuts on ${day.date}`}
              >
                <option value="">— nobody —</option>
                {board.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              {badge && (
                <span className={`${styles.badge} ${badge.cover ? styles.badgeCover : ''}`}>
                  {badge.label}
                </span>
              )}
              {overrideDates.has(day.date) && (
                <button
                  type="button"
                  className={styles.button}
                  disabled={busy}
                  onClick={() => clear(day.date)}
                >
                  Clear
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';

import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatDayHeading,
  monthLabel,
  shiftMonth,
  type MonthCursor,
} from '../../calendar-grid';
import { calendarLabels } from '../content';
import styles from './CalendarWindow.module.scss';

function cursorOf(iso: string): MonthCursor {
  const [year, month] = iso.split('-').map(Number);
  return { year, month: month - 1 };
}

/**
 * A month as a many-paned window at dusk: white muntins, cool glass, the
 * weekdays on the head casing. Today's pane is lit from inside; choosing a
 * day lights its pane fully. No events are passed in — the church has
 * published none.
 */
export function CalendarWindow({ todayIso }: { todayIso: string }) {
  const [cursor, setCursor] = useState<MonthCursor>(() => cursorOf(todayIso));
  const [selected, setSelected] = useState(todayIso);
  const label = monthLabel(cursor);
  const cells = buildMonthGrid(cursor, []);

  return (
    <div className={styles.calendar}>
      <div className={styles.plaque}>
        <button
          type="button"
          className={styles.turn}
          aria-label={calendarLabels.previous}
          onClick={() => setCursor(shiftMonth(cursor, -1))}
        >
          ‹
        </button>
        <h2 className={styles.month} aria-live="polite">
          {label}
        </h2>
        <button
          type="button"
          className={styles.turn}
          aria-label={calendarLabels.next}
          onClick={() => setCursor(shiftMonth(cursor, 1))}
        >
          ›
        </button>
      </div>

      <div className={styles.window}>
        <div className={styles.head} aria-hidden="true">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className={styles.panes}>
          {cells.map((cell, index) =>
            cell.iso === null ? (
              <span key={`blank-${index}`} className={styles.blank} />
            ) : (
              <button
                key={cell.iso}
                type="button"
                className={styles.pane}
                aria-pressed={cell.iso === selected}
                aria-label={formatDayHeading(cell.iso)}
                data-today={cell.iso === todayIso ? '' : undefined}
                onClick={() => setSelected(cell.iso as string)}
              >
                <span>{cell.dayOfMonth}</span>
              </button>
            ),
          )}
        </div>
      </div>

      <div className={styles.day} aria-live="polite">
        <h3 className={styles.dayHeading}>
          {formatDayHeading(selected)}
          {selected === todayIso ? <span className={styles.today}>{calendarLabels.today}</span> : null}
        </h3>
        <p className={styles.dayEmpty}>{calendarLabels.empty}</p>
      </div>
    </div>
  );
}

'use client';

import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  monthLabel,
  type DayCell,
  type MonthCursor,
} from '../calendar-grid';
import { eventKindLabels, type CalendarEvent } from '../content';
import styles from './MoriahDemo.module.scss';

function DayCellButton({
  cell,
  selected,
  isToday,
  onSelect,
}: {
  cell: DayCell;
  selected: boolean;
  isToday: boolean;
  onSelect: (iso: string) => void;
}) {
  const count = cell.events.length;
  const className = [
    styles.dayCell,
    selected ? styles.daySelected : '',
    isToday ? styles.dayToday : '',
    count > 0 ? styles.dayHasEvents : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      role="gridcell"
      className={className}
      aria-pressed={selected}
      onClick={() => onSelect(cell.iso as string)}
    >
      <span className={styles.dayNumber}>{cell.dayOfMonth}</span>
      {count > 0 && (
        <span className={styles.dayDots}>
          {cell.events.slice(0, 3).map((event) => (
            <span
              key={event.id}
              className={`${styles.kindDot} ${styles[event.kind]}`}
              aria-hidden="true"
            />
          ))}
        </span>
      )}
      <span className={styles.srOnly}>
        {count === 0 ? 'No events' : `${count} ${count === 1 ? 'event' : 'events'}`}
      </span>
    </button>
  );
}

/**
 * The month card: title row, weekday header, the six-week grid, and the
 * legend. It owns no state — the selected day and the visible month both
 * live in ChurchCalendar, which also renders the day detail panel beside it.
 */
export function MonthGrid({
  cursor,
  events,
  selected,
  todayIso,
  onSelect,
  onMonthChange,
}: {
  cursor: MonthCursor;
  events: CalendarEvent[];
  selected: string | null;
  todayIso: string;
  onSelect: (iso: string) => void;
  onMonthChange: (delta: number) => void;
}) {
  const label = monthLabel(cursor);
  const cells = buildMonthGrid(cursor, events);

  return (
    <div className={styles.calendarCard}>
      <div className={styles.calendarNav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onMonthChange(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className={styles.monthLabel} aria-live="polite">
          {label}
        </h3>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onMonthChange(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className={styles.weekdayRow} aria-hidden="true">
        {WEEKDAY_LABELS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className={styles.monthGrid} role="grid" aria-label={label}>
        {cells.map((cell, index) =>
          cell.iso === null ? (
            <span key={`blank-${index}`} className={styles.dayBlank} role="presentation" />
          ) : (
            <DayCellButton
              key={cell.iso}
              cell={cell}
              selected={cell.iso === selected}
              isToday={cell.iso === todayIso}
              onSelect={onSelect}
            />
          ),
        )}
      </div>

      <div className={styles.legend}>
        {(Object.keys(eventKindLabels) as CalendarEvent['kind'][]).map((kind) => (
          <span key={kind} className={styles.legendItem}>
            <span className={`${styles.kindDot} ${styles[kind]}`} aria-hidden="true" />
            {eventKindLabels[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}

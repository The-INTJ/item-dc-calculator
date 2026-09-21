'use client';

import { useState } from 'react';

import {
  eventsByDate,
  formatDayHeading,
  monthLabel,
  shiftMonth,
  upcomingEvents,
  type MonthCursor,
} from '../calendar-grid';
import { calendarEvents, eventKindLabels, type CalendarEvent } from '../content';
import styles from './MoriahDemo.module.scss';
import { MonthGrid } from './MonthGrid';

/** The month the preview opens on, and the "today" marker. */
const TODAY_ISO = '2026-09-21';
const INITIAL_CURSOR: MonthCursor = { year: 2026, month: 8 };

/**
 * Open on the next day that actually has something on it, so the detail panel
 * isn't empty on arrival. Falls back to today when nothing is scheduled.
 * Computed lazily in state rather than at module scope — the work is the same
 * either way, and module-level evaluation makes Fast Refresh full-reload.
 */
function initialSelectedDay(): string {
  return upcomingEvents(calendarEvents, TODAY_ISO, 1)[0]?.date ?? TODAY_ISO;
}

function EventEntry({ event }: { event: CalendarEvent }) {
  return (
    <li className={styles.eventEntry}>
      <span className={styles.eventTime}>{event.time}</span>
      <div>
        <p className={styles.eventTitle}>{event.title}</p>
        <p className={styles.eventDetail}>{event.detail}</p>
        <div className={styles.eventMeta}>
          <span className={`${styles.kindDot} ${styles[event.kind]}`} aria-hidden="true" />
          <span>{eventKindLabels[event.kind]}</span>
        </div>
      </div>
    </li>
  );
}

/** The month card and the day detail panel, side by side. */
export function ChurchCalendar() {
  const [cursor, setCursor] = useState<MonthCursor>(INITIAL_CURSOR);
  const [selected, setSelected] = useState<string | null>(initialSelectedDay);

  const selectedEvents = selected ? (eventsByDate(calendarEvents).get(selected) ?? []) : [];

  function goToMonth(delta: number) {
    setCursor(shiftMonth(cursor, delta));
    setSelected(null);
  }

  return (
    <div className={styles.calendarLayout}>
      <MonthGrid
        cursor={cursor}
        events={calendarEvents}
        selected={selected}
        todayIso={TODAY_ISO}
        onSelect={setSelected}
        onMonthChange={goToMonth}
      />

      <div className={styles.dayPanel}>
        <h3 className={styles.dayPanelHeading}>
          {selected ? formatDayHeading(selected) : monthLabel(cursor)}
        </h3>
        {selected && selectedEvents.length > 0 ? (
          <ul className={styles.eventList}>
            {selectedEvents.map((event) => (
              <EventEntry key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <p className={styles.dayPanelEmpty}>
            {selected
              ? 'Nothing on the calendar for this day.'
              : 'Choose a day to see what is happening.'}
          </p>
        )}
      </div>
    </div>
  );
}

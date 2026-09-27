import { calendarLabels } from '../content';
import { CalendarWindow } from './CalendarWindow';
import room from './Room.module.scss';
import styles from './CalendarWindow.module.scss';

/** Today in Colbert, as YYYY-MM-DD — computed once on the server so both renders agree. */
function churchToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * The church calendar. The live Calendar page lists no events, so this one
 * carries none either — only today's pane is lit — and the notice says why.
 */
export function CalendarPage() {
  return (
    <section className={styles.page}>
      <p className={room.notice}>{calendarLabels.notice}</p>
      <CalendarWindow todayIso={churchToday()} />
    </section>
  );
}

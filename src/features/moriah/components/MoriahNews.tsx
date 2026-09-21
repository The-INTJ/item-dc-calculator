import { formatLongDate, formatShortDate, upcomingEvents } from '../calendar-grid';
import {
  announcements,
  calendarEvents,
  eventKindLabels,
  newsPage,
  type Announcement,
} from '../content';
import { ChurchCalendar } from './ChurchCalendar';
import styles from './MoriahDemo.module.scss';

const TODAY_ISO = '2026-09-21';

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <article className={`${styles.newsCard} ${item.pinned ? styles.newsCardPinned : ''}`}>
      <div className={styles.newsCardHead}>
        <span className={styles.newsDate}>Updated {formatLongDate(item.date)}</span>
      </div>
      <h3 className={styles.newsTitle}>{item.title}</h3>
      <p className={styles.newsBody}>{item.body}</p>
    </article>
  );
}

export function MoriahNews() {
  const upcoming = upcomingEvents(calendarEvents, TODAY_ISO, 5);

  return (
    <>
      <section className={`${styles.band} ${styles.newsHeadBand}`}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>{newsPage.eyebrow}</span>
          <h1 className={styles.h1}>{newsPage.headline}</h1>
          <p className={styles.notice}>{newsPage.notice}</p>
        </div>
      </section>

      <section className={styles.band} aria-labelledby="mo-calendar-heading">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="mo-calendar-heading" className={styles.h2}>
              Church calendar
            </h2>
          </div>
          <ChurchCalendar />
        </div>
      </section>

      <section
        className={`${styles.band} ${styles.bandStone}`}
        aria-labelledby="mo-upcoming-heading"
      >
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="mo-upcoming-heading" className={styles.h2}>
              Coming up
            </h2>
          </div>
          <ul className={styles.upcomingList}>
            {upcoming.map((event) => (
              <li key={event.id} className={styles.upcomingItem}>
                <span className={styles.upcomingDate}>{formatShortDate(event.date)}</span>
                <div>
                  <p className={styles.upcomingTitle}>{event.title}</p>
                  <p className={styles.upcomingDetail}>{event.detail}</p>
                </div>
                <span className={styles.upcomingMeta}>
                  <span className={`${styles.kindDot} ${styles[event.kind]}`} aria-hidden="true" />
                  {event.time} · {eventKindLabels[event.kind]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${styles.band} ${styles.bandLinen}`} aria-labelledby="mo-news-heading">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2 id="mo-news-heading" className={styles.h2}>
              Announcements
            </h2>
          </div>
          <div className={styles.newsGrid}>
            {announcements.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

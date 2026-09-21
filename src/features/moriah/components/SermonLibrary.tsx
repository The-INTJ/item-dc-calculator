'use client';

import { useState } from 'react';

import { sermonSection, sermons, urls, type Sermon } from '../content';
import { facetValues, filterSermons, highlight, type SortOrder } from '../sermon-search';
import styles from './MoriahDemo.module.scss';

const allBooks = facetValues(sermons, 'book');

/** Renders a field with the reader's search terms marked. */
function Highlighted({ value, query }: { value: string; query: string }) {
  return (
    <>
      {highlight(value, query).map((segment, index) =>
        segment.matched ? (
          <mark key={index} className={styles.mark}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function SermonRow({ sermon, query }: { sermon: Sermon; query: string }) {
  return (
    <li className={styles.sermonItem}>
      <span className={styles.sermonScriptureCol}>
        <Highlighted value={sermon.scripture} query={query} />
      </span>
      <div>
        <h3 className={styles.sermonTitle}>
          <Highlighted value={sermon.title} query={query} />
        </h3>
        <p className={styles.sermonSummary}>
          <Highlighted value={sermon.summary} query={query} />
        </p>
        <div className={styles.sermonTags}>
          <span className={styles.sermonTag}>
            <Highlighted value={sermon.book} query={query} />
          </span>
        </div>
      </div>
      <div className={styles.sermonActions}>
        <a href={urls.sermonArchive} className={styles.playButton}>
          <span aria-hidden="true">▸</span> Listen
        </a>
      </div>
    </li>
  );
}

/** Chip row for the book facet; `null` means "all". */
function BookChips({
  active,
  onChange,
}: {
  active: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className={styles.filterRow}>
      <span className={styles.filterLabel}>Book</span>
      <button
        type="button"
        className={`${styles.chip} ${active === null ? styles.chipActive : ''}`}
        aria-pressed={active === null}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {allBooks.map((book) => (
        <button
          key={book}
          type="button"
          className={`${styles.chip} ${active === book ? styles.chipActive : ''}`}
          aria-pressed={active === book}
          onClick={() => onChange(active === book ? null : book)}
        >
          {book}
        </button>
      ))}
    </div>
  );
}

export function SermonLibrary() {
  const [text, setText] = useState('');
  const [book, setBook] = useState<string | null>(null);
  const [order, setOrder] = useState<SortOrder>('a-z');

  const results = filterSermons(sermons, { text, book, order });

  return (
    <section
      id="sermons"
      className={`${styles.band} ${styles.bandLinen}`}
      aria-labelledby="mo-sermons-heading"
    >
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{sermonSection.eyebrow}</span>
          <h2 id="mo-sermons-heading" className={styles.h2}>
            {sermonSection.headline}
          </h2>
          <p className={styles.lede}>{sermonSection.sub}</p>
          <p className={styles.notice}>{sermonSection.notice}</p>
        </div>

        <div className={styles.searchBar}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            className={styles.searchInput}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search sermons — try “Romans”, “election”, or “finished”"
            aria-label="Search sermons"
          />
          {text !== '' && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setText('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <BookChips active={book} onChange={setBook} />

        <div className={styles.resultMeta}>
          <span aria-live="polite">
            {results.length} {results.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            type="button"
            className={styles.sortToggle}
            onClick={() => setOrder(order === 'a-z' ? 'z-a' : 'a-z')}
          >
            {order === 'a-z' ? 'Title A–Z' : 'Title Z–A'} ⇅
          </button>
        </div>

        {results.length > 0 ? (
          <ul className={styles.sermonList}>
            {results.map((sermon) => (
              <SermonRow key={sermon.id} sermon={sermon} query={text} />
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Nothing found</p>
            <p className={styles.emptyBody}>
              Try a book of the Bible, a word from the title, or a phrase from the text.
            </p>
          </div>
        )}

        <div className={styles.bandFoot}>
          <a href={urls.sermonArchive} className={styles.buttonGhost}>
            {sermonSection.archiveCta}
          </a>
        </div>
      </div>
    </section>
  );
}

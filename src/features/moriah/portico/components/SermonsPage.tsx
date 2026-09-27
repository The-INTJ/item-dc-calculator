'use client';

import { useState } from 'react';

import { sermonSection, sermons, urls, type Sermon } from '../../content';
import { facetValues, filterSermons, highlight, type SortOrder } from '../../sermon-search';
import { sermonsLabels, siteLabels } from '../content';
import { PanelLink } from './PanelLink';
import room from './Room.module.scss';
import styles from './SermonsPage.module.scss';

const BOOKS = facetValues(sermons, 'book');

/** A field with the reader's search terms lit, as if by lamplight. */
function Marked({ value, query }: { value: string; query: string }) {
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

/** One entry, as a clapboard: a painted board lapped over the one below. */
function Board({ sermon, query }: { sermon: Sermon; query: string }) {
  return (
    <li className={styles.board}>
      <p className={styles.scripture}>
        <Marked value={sermon.scripture} query={query} />
      </p>
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Marked value={sermon.title} query={query} />
        </h2>
        <p className={styles.summary}>
          <Marked value={sermon.summary} query={query} />
        </p>
      </div>
      <a href={urls.sermonArchive} className={styles.listen}>
        {siteLabels.listen}
      </a>
    </li>
  );
}

function BookChips({ book, onBook }: { book: string | null; onBook: (next: string | null) => void }) {
  return (
    <div className={styles.chips} role="group" aria-label={sermonsLabels.bookLabel}>
      <span className={styles.chipsLabel}>{sermonsLabels.bookLabel}</span>
      {[null, ...BOOKS].map((value) => (
        <button
          key={value ?? 'all'}
          type="button"
          className={styles.chip}
          aria-pressed={book === value}
          onClick={() => onBook(book === value ? null : value)}
        >
          {value ?? sermonsLabels.all}
        </button>
      ))}
    </div>
  );
}

/** The sermon library, searchable. Its entries are Moriah's own words; the notice says so. */
export function SermonsPage() {
  const [text, setText] = useState('');
  const [book, setBook] = useState<string | null>(null);
  const [order, setOrder] = useState<SortOrder>('a-z');
  const results = filterSermons(sermons, { text, book, order });

  return (
    <section className={styles.library}>
      <p className={room.notice}>{sermonSection.notice}</p>

      <label className={styles.search}>
        <span className={styles.srOnly}>{sermonsLabels.searchPlaceholder}</span>
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={sermonsLabels.searchPlaceholder}
        />
      </label>

      <BookChips book={book} onBook={setBook} />

      <div className={styles.meta}>
        <span aria-live="polite">
          {results.length} {results.length === 1 ? sermonsLabels.entry : sermonsLabels.entries}
        </span>
        <button
          type="button"
          className={styles.sort}
          onClick={() => setOrder(order === 'a-z' ? 'z-a' : 'a-z')}
        >
          {order === 'a-z' ? sermonsLabels.sortAscending : sermonsLabels.sortDescending}
        </button>
      </div>

      {results.length > 0 ? (
        <ul className={styles.boards}>
          {results.map((sermon) => (
            <Board key={sermon.id} sermon={sermon} query={text} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{sermonsLabels.empty}</p>
      )}

      <PanelLink href={urls.sermonArchive} external>
        {sermonSection.archiveCta}
      </PanelLink>
    </section>
  );
}

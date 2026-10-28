/**
 * Where a "Bible in a year" reader should be on a given day.
 *
 * Each day adds a fixed number of verses to the running total, and wherever
 * that lands mid-chapter the reader finishes the chapter. The next day's
 * verses count from that chapter boundary, so the overshoot carries forward
 * instead of being paid back.
 */

import { BOOKS } from './books';

/** Hard-coded for now: started 2026-10-27, 86 verses a day. */
export const PLAN = { startDate: '2026-10-27', versesPerDay: 86 } as const;

export interface ChapterRef {
  book: string;
  chapter: number;
}

export interface ReadingTarget {
  /** 1-based day of the plan; the start date is day 1. */
  day: number;
  /** First chapter of the day's reading. */
  from: ChapterRef;
  /** Last chapter of the day's reading. */
  through: ChapterRef;
  /** The chapter the reader stops in front of; null once Revelation is done. */
  upTo: ChapterRef | null;
}

interface FlatChapter extends ChapterRef {
  /** Running verse total at the end of this chapter. */
  endsAt: number;
}

const CHAPTERS: readonly FlatChapter[] = (() => {
  let total = 0;
  return BOOKS.flatMap((book) =>
    book.chapters.map((verses, index) => {
      total += verses;
      return { book: book.name, chapter: index + 1, endsAt: total };
    }),
  );
})();

const LAST = CHAPTERS.length - 1;

function ref({ book, chapter }: FlatChapter): ChapterRef {
  return { book, chapter };
}

/** Index of the chapter holding the verse at running position `verse`. */
function chapterHolding(verse: number) {
  const index = CHAPTERS.findIndex((chapter) => chapter.endsAt >= verse);
  return index === -1 ? LAST : index;
}

/** Whole calendar days from one `YYYY-MM-DD` date to another. */
export function daysBetween(fromIso: string, toIso: string) {
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000);
}

/** The reading for plan day `day` (clamped to day 1). */
export function readingForDay(day: number, versesPerDay: number = PLAN.versesPerDay): ReadingTarget {
  const target = Math.max(1, day);
  let start = 0;
  let end = -1;
  // Once Revelation is done, later days keep the final day's reading.
  for (let current = 1; current <= target && end < LAST; current += 1) {
    start = end + 1;
    end = chapterHolding((end < 0 ? 0 : CHAPTERS[end].endsAt) + versesPerDay);
  }
  return {
    day: target,
    from: ref(CHAPTERS[start]),
    through: ref(CHAPTERS[end]),
    upTo: end < LAST ? ref(CHAPTERS[end + 1]) : null,
  };
}

/** The reading for a calendar date in `YYYY-MM-DD` form. */
export function readingForDate(iso: string): ReadingTarget {
  return readingForDay(daysBetween(PLAN.startDate, iso) + 1);
}

export function formatRef({ book, chapter }: ChapterRef) {
  return `${book} ${chapter}`;
}

/** "Genesis 5–8", or "Genesis 49 – Exodus 2" when the range spans books. */
export function formatRange(from: ChapterRef, through: ChapterRef) {
  if (from.book !== through.book) {
    return `${formatRef(from)} – ${formatRef(through)}`;
  }
  if (from.chapter === through.chapter) {
    return formatRef(from);
  }
  return `${from.book} ${from.chapter}–${through.chapter}`;
}

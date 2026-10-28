'use client';

import { useSyncExternalStore } from 'react';

import { formatRange, formatRef, readingForDate } from '../lib/readingPlan';

interface BibleReadingCardProps {
  classNames: { card: string; title: string; description: string };
}

/** Today's date in the reader's own time zone, as `YYYY-MM-DD`. */
function localToday() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const noSubscription = () => () => {};

/**
 * The portal's Bible-in-a-year widget: no page of its own, just today's
 * stopping point. The date is only known in the browser, so the server
 * renders the card's frame and the client fills it in.
 */
export function BibleReadingCard({ classNames }: BibleReadingCardProps) {
  const today = useSyncExternalStore(noSubscription, localToday, () => null);
  const reading = today ? readingForDate(today) : null;

  let title = 'Bible in a year';
  let description = ' ';
  if (reading) {
    title = reading.upTo ? `Read up to ${formatRef(reading.upTo)}` : 'Finished the Bible';
    description = `Day ${reading.day} · ${formatRange(reading.from, reading.through)}`;
  }

  return (
    <div className={classNames.card} aria-live="polite">
      <span className={classNames.title}>{title}</span>
      <span className={classNames.description}>{description}</span>
    </div>
  );
}

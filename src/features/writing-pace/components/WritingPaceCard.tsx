'use client';

import { useEffect, useState } from 'react';

import type { RecentPace, WritingPace } from '../lib/pace';

import styles from './WritingPaceCard.module.scss';

interface WritingPaceCardProps {
  classNames: { card: string; title: string; description: string };
}

type PaceState = { status: 'loading' } | { status: 'ready'; pace: WritingPace } | { status: 'unavailable' };

const number = new Intl.NumberFormat('en-US');

const plural = (count: number, unit: string) => `${count} ${count === 1 ? unit : `${unit}s`}`;

function describeRecent({ perDay, days }: RecentPace) {
  return `${number.format(perDay)} a day over the last ${plural(days, 'day')}`;
}

function describe(state: PaceState) {
  if (state.status === 'ready') {
    const { perDay, words, days, recent } = state.pace;
    return {
      title: `${number.format(perDay)} words a day`,
      description: `Wick · ${number.format(words)} words in ${plural(days, 'day')}`,
      recent: recent ? describeRecent(recent) : null,
    };
  }
  return {
    recent: null,
    title: 'Words a day',
    description: state.status === 'loading' ? ' ' : 'Not connected yet',
  };
}

async function loadPace(init?: RequestInit): Promise<WritingPace> {
  const response = await fetch('/api/writing-pace', init);
  if (!response.ok) {
    throw new Error(`writing-pace ${response.status}`);
  }
  return response.json();
}

/**
 * The portal's writing-pace widget: no page of its own, just the words-per-day
 * average from the manuscript's 6am snapshot and the rolling week's average
 * once a past count is stored, with a button to recount now.
 */
export function WritingPaceCard({ classNames }: WritingPaceCardProps) {
  const [state, setState] = useState<PaceState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let live = true;
    loadPace()
      .then((pace) => live && setState({ status: 'ready', pace }))
      .catch(() => live && setState({ status: 'unavailable' }));
    return () => {
      live = false;
    };
  }, []);

  const refresh = () => {
    setRefreshing(true);
    loadPace({ method: 'POST' })
      .then((pace) => setState({ status: 'ready', pace }))
      // A failed recount leaves the last good numbers on screen.
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  const { title, description, recent } = describe(state);
  return (
    <div className={`${classNames.card} ${styles.host}`} aria-live="polite">
      <span className={classNames.title}>{title}</span>
      <span className={classNames.description}>{description}</span>
      {recent && <span className={classNames.description}>{recent}</span>}
      {state.status === 'ready' && (
        <button
          type="button"
          className={styles.refresh}
          onClick={refresh}
          disabled={refreshing}
          aria-label="Recount words now"
          title="Recount words now"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={refreshing ? styles.spinning : undefined}>
            <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
          </svg>
        </button>
      )}
    </div>
  );
}

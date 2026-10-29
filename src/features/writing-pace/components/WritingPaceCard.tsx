'use client';

import { useEffect, useState } from 'react';

import type { WritingPace } from '../lib/pace';

interface WritingPaceCardProps {
  classNames: { card: string; title: string; description: string };
}

type PaceState = { status: 'loading' } | { status: 'ready'; pace: WritingPace } | { status: 'unavailable' };

const number = new Intl.NumberFormat('en-US');

function describe(state: PaceState) {
  if (state.status === 'ready') {
    const { perDay, words, days } = state.pace;
    return {
      title: `${number.format(perDay)} words a day`,
      description: `Wick · ${number.format(words)} words in ${days} ${days === 1 ? 'day' : 'days'}`,
    };
  }
  return {
    title: 'Words a day',
    description: state.status === 'loading' ? ' ' : 'Not connected yet',
  };
}

/**
 * The portal's writing-pace widget: no page of its own, just the words-per-day
 * average the API takes from the manuscript's 6am snapshot.
 */
export function WritingPaceCard({ classNames }: WritingPaceCardProps) {
  const [state, setState] = useState<PaceState>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    fetch('/api/writing-pace')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((pace: WritingPace) => live && setState({ status: 'ready', pace }))
      .catch(() => live && setState({ status: 'unavailable' }));
    return () => {
      live = false;
    };
  }, []);

  const { title, description } = describe(state);
  return (
    <div className={classNames.card} aria-live="polite">
      <span className={classNames.title}>{title}</span>
      <span className={classNames.description}>{description}</span>
    </div>
  );
}

'use client';

import { useState } from 'react';

import type { TipCard, TipCategory } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface GrassTipCardsProps {
  cards: TipCard[];
  loading: boolean;
}

const FILTERS: { value: TipCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All notes' },
  { value: 'water', label: 'Water' },
  { value: 'grow', label: 'Grow' },
  { value: 'weeds', label: 'Weeds' },
  { value: 'sun', label: 'Sun & shade' },
  { value: 'soil', label: 'Soil' },
];

export function GrassTipCards({ cards, loading }: GrassTipCardsProps) {
  const [filter, setFilter] = useState<TipCategory | 'all'>('all');
  const visible = filter === 'all' ? cards : cards.filter((card) => card.category === filter);
  return (
    <section className={styles.tipsSection}>
      <div className={styles.tipsHeader}><div><span className={styles.eyebrow}>Living field notes</span><h2>Small advice for the problem in front of you</h2><p>These cards can be refreshed or rewritten by an AI through the protected tips API as your yard changes.</p></div><span className={styles.aiBadge}>AI-ready</span></div>
      <div className={styles.tipFilters} role="tablist" aria-label="Tip categories">{FILTERS.map((item) => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} data-active={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
      {loading && <p className={styles.loadingLine}>Loading the latest notes…</p>}
      <div className={styles.tipGrid}>{visible.map((card) => <article className={styles.tipCard} key={card.id} data-category={card.category}><div className={styles.tipCardTop}><span>{card.category}</span>{card.updatedAt && <time dateTime={card.updatedAt}>updated</time>}</div><h3>{card.title}</h3><p className={styles.tipSummary}>{card.summary}</p><p>{card.body}</p><div className={styles.tagRow}>{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</div>
      <details className={styles.apiNote}><summary>For AI / API authors</summary><p>Use <code>POST /api/grass-manager/tips</code> to add a card and <code>PATCH /api/grass-manager/tips/:id</code> to revise one. Mutations use the same approved Firebase identity as the private plant tracker.</p></details>
    </section>
  );
}

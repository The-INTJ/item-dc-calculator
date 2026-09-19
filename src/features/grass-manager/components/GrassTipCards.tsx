import type { TipCard } from '../lib/types';
import styles from './GrassManagerView.module.scss';

export function GrassTipCards({ cards }: { cards: TipCard[] }) {
  // Starter advice is intentionally silent. Keep authored/API-updated notes available.
  const card = cards.filter((item) => item.updatedAt).sort((a, b) => b.updatedAt!.localeCompare(a.updatedAt!))[0];
  if (!card) return null;
  return (
    <details className={styles.fieldNote}>
      <summary>Field note · {card.title}</summary>
      <p><strong>{card.summary}</strong></p><p>{card.body}</p>
    </details>
  );
}

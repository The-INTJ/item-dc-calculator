import Link from 'next/link';

import type { GearPiece, Quote, SocialEntry, Trait } from '../../content';
import styles from '../../styles/cards.module.scss';
import typo from '../../styles/type.module.scss';
import { Icon, toneStyle } from '../ui/primitives';

export function QuoteCard({ quote, size = 'md' }: { quote: Quote; size?: 'md' | 'lg' }) {
  return (
    <figure
      className={`${styles.quote} ${size === 'lg' ? styles.quoteLg : ''}`}
      style={toneStyle(quote.accent)}
    >
      <div className={styles.quoteMark} aria-hidden="true">
        “
      </div>
      <blockquote className={styles.quoteText}>{quote.quote}</blockquote>
      <figcaption className={styles.quoteBy}>
        <strong>{quote.name}</strong>
        <span className={typo.label} style={{ color: 'var(--text-secondary)' }}>
          {quote.role}
        </span>
      </figcaption>
    </figure>
  );
}

export function TraitCard({ trait }: { trait: Trait }) {
  return (
    <div className={styles.trait} style={toneStyle(trait.accent)}>
      <span className={styles.chip}>
        <Icon name={trait.icon} size={22} />
      </span>
      <h3>{trait.title}</h3>
      <p>{trait.body}</p>
    </div>
  );
}

/** Model name for the sound folks, a plain-English line for everyone else. */
export function GearItem({ item }: { item: GearPiece }) {
  return (
    <div className={styles.gearRow}>
      <div className={styles.gearName}>
        <span>{item.name}</span>
        {item.count && <span className={styles.gearCount}>×{item.count}</span>}
        <span className={styles.gearCategory}>{item.category}</span>
      </div>
      <span className={styles.gearPlain}>{item.plain}</span>
    </div>
  );
}

export function SocialLink({ entry }: { entry: SocialEntry }) {
  const inner = (
    <>
      <span className={styles.chip}>
        <Icon name={entry.icon} size={22} />
      </span>
      <span className={styles.socialText}>
        <span className={styles.socialLabel}>{entry.label}</span>
        <span className={styles.socialHandle}>{entry.handle}</span>
      </span>
      <span className={styles.socialArrow} aria-hidden="true">
        →
      </span>
    </>
  );

  if (!entry.external) {
    return (
      <Link href={entry.href} className={styles.social} style={toneStyle(entry.accent)}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={entry.href}
      target="_blank"
      rel="noreferrer"
      className={styles.social}
      style={toneStyle(entry.accent)}
    >
      {inner}
    </a>
  );
}

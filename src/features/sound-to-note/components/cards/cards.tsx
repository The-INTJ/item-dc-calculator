import type { GearPiece, Quote, SocialEntry } from '../../content';
import styles from '../../styles/cards.module.scss';
import typo from '../../styles/type.module.scss';
import { Icon, PhotoFrame, toneStyle } from '../ui/primitives';

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

/** A testimonial over a photo of Alex working that job — the About page's wall. */
export function QuotePhotoCard({ quote }: { quote: Quote }) {
  return (
    <div className={styles.quotePhoto}>
      <PhotoFrame label={quote.photo} ratio="4/3" />
      <QuoteCard quote={quote} />
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

/** Web links open in a new tab; `mailto:` stays put and hands off to the mail app. */
export function SocialLink({ entry }: { entry: SocialEntry }) {
  const web = entry.href.startsWith('http');
  return (
    <a
      href={entry.href}
      target={web ? '_blank' : undefined}
      rel={web ? 'noreferrer' : undefined}
      className={styles.social}
      style={toneStyle(entry.accent)}
    >
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
    </a>
  );
}

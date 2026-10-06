import type { CSSProperties, ReactNode } from 'react';

import type { Accent } from '../../content';
import styles from '../../styles/ui.module.scss';
import typo from '../../styles/type.module.scss';

export const accentVar: Record<Accent, string> = {
  orange: 'var(--stn-orange)',
  cyan: 'var(--stn-cyan)',
  violet: 'var(--stn-violet)',
  pink: 'var(--stn-pink)',
  gold: 'var(--stn-gold)',
};

/** Sets the `--tone` custom property the tag, sticker and card styles read. */
export function toneStyle(accent: Accent, extra: CSSProperties = {}): CSSProperties {
  return { '--tone': accentVar[accent], ...extra } as CSSProperties;
}

/**
 * Lucide outline icon, drawn as a CSS mask so it takes `currentColor`.
 * Lucide is the design system's stand-in — the brief shipped no icon set.
 */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const url = `url(https://unpkg.com/lucide-static@0.460.0/icons/${name}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={styles.icon}
      style={{ width: size, height: size, '--icon': url } as CSSProperties}
    />
  );
}

export function Tag({
  tone,
  outline = false,
  children,
}: {
  tone?: Accent;
  outline?: boolean;
  children: ReactNode;
}) {
  const cls = `${styles.tag} ${outline ? styles.tagOutline : ''} ${tone ? '' : styles.tagNeutral}`;
  return (
    <span className={cls} style={tone ? toneStyle(tone) : undefined}>
      {children}
    </span>
  );
}

/** The humor layer. At most one per photo, tilted no more than ±2°. */
export function Sticker({
  tone = 'gold',
  tilt = -1.5,
  children,
}: {
  tone?: Accent;
  tilt?: number;
  children: ReactNode;
}) {
  return (
    <span className={styles.sticker} style={toneStyle(tone, { rotate: `${tilt}deg` })}>
      {children}
    </span>
  );
}

export function PhotoFrame({
  label,
  ratio = '4/3',
  radius,
  caption,
}: {
  label: string;
  ratio?: string;
  radius?: string;
  caption?: ReactNode;
}) {
  return (
    <figure className={styles.photo} style={{ aspectRatio: ratio, borderRadius: radius }}>
      <div className={styles.photoLabel}>{label}</div>
      {caption && <figcaption className={styles.photoCaption}>{caption}</figcaption>}
    </figure>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <header className={`${styles.header} ${center ? styles.headerCenter : ''}`}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <h2 className={`${typo.display} ${typo.h1}`}>{title}</h2>
      {lead && <p className={typo.lead}>{lead}</p>}
    </header>
  );
}

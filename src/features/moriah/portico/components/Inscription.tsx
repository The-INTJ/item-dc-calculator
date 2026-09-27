import type { ReactNode } from 'react';

import styles from './Inscription.module.scss';

/**
 * A room's label: inscribed capitals under a small gable — the pediment's
 * outline, drawn at the size of a letter. Every label on the preview is one of
 * the church's own headings.
 */
export function Inscription({
  children,
  as: Tag = 'h2',
  id,
  tone = 'dark',
}: {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  id?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <Tag id={id} className={`${styles.inscription} ${tone === 'light' ? styles.light : ''}`}>
      <svg className={styles.gable} viewBox="0 0 34 11" aria-hidden="true" focusable="false">
        <path d="M1 10 L17 1.5 L33 10" />
        <path d="M6 10 L17 4.2 L28 10" />
      </svg>
      <span>{children}</span>
    </Tag>
  );
}

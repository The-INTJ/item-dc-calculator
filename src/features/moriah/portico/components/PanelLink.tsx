import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from './PanelLink.module.scss';

/**
 * The preview's only button shape: a raised panel, cut like the panels of
 * Moriah's doors — four bevels around a flat field. Hover warms it with
 * lamplight; pressing sinks the bevels. Internal paths use Next's Link.
 */
export function PanelLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return external ? (
    <a href={href} className={styles.panel}>
      {children}
    </a>
  ) : (
    <Link href={href} className={styles.panel}>
      {children}
    </Link>
  );
}

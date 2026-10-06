import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from '../../styles/ui.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Internal paths render a Next `Link`; `mailto:`/`tel:` render a plain anchor. */
  href?: string;
  type?: 'button' | 'submit';
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

/** Pill button. Primary is the logo gradient and is reserved for booking. */
export function Button({
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  icon,
  iconRight,
  className = '',
  onClick,
  children,
}: ButtonProps) {
  const cls = `${styles.btn} ${styles[size]} ${styles[variant]} ${className}`;
  const inner = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  );

  if (href?.startsWith('/')) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'tertiary' | 'on-dark' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface CommonButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

type NativeButtonProps = Omit<ComponentPropsWithoutRef<'button'>, keyof CommonButtonProps>;
type NativeAnchorProps = Omit<ComponentPropsWithoutRef<'a'>, keyof CommonButtonProps | 'href'>;

type AsButtonProps = CommonButtonProps & NativeButtonProps & {
  href?: undefined;
};

type AsLinkProps = CommonButtonProps & NativeAnchorProps & {
  href: string;
};

export type ButtonProps = AsButtonProps | AsLinkProps;

function composeClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  block: boolean | undefined,
  extra: string | undefined,
): string {
  const parts = ['btn', `btn--${variant}`];
  if (size === 'sm') parts.push('btn--sm');
  if (block) parts.push('btn--block');
  if (extra) parts.push(extra);
  return parts.join(' ');
}

export function Button(props: ButtonProps) {
  const { variant = 'secondary', size = 'md', block, className, children, ...rest } = props;
  const composed = composeClassName(variant, size, block, className);

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AsLinkProps;
    return (
      <Link href={href} className={composed} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as NativeButtonProps;
  return (
    <button
      type={buttonRest.type ?? 'button'}
      className={composed}
      {...buttonRest}
    >
      {children}
    </button>
  );
}

import type { HTMLAttributes } from 'react';

interface MaterialSymbolProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  label?: string;
}

export function MaterialSymbol({
  name,
  label,
  className = '',
  ...props
}: MaterialSymbolProps) {
  const classes = ['material-symbol', className].filter(Boolean).join(' ');

  return (
    <span
      {...props}
      className={classes}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}

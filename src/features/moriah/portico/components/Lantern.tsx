/**
 * The black carriage lantern mounted on the brick beside Moriah's door, lit.
 * Its cap is a small gable of its own.
 */
export function Lantern({
  className,
  idPrefix = 'lantern',
}: {
  className?: string;
  idPrefix?: string;
}) {
  const flame = `${idPrefix}-flame`;

  return (
    <svg viewBox="0 0 40 92" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={flame} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#fff7dc" />
          <stop offset="0.45" stopColor="#fbd88e" />
          <stop offset="1" stopColor="#d98b3a" />
        </radialGradient>
      </defs>
      <g fill="#161412">
        <circle cx="20" cy="4" r="2.6" />
        <path d="M5 19 L20 8 L35 19 Z" />
        <rect x="4" y="19" width="32" height="4" rx="0.8" />
        <rect x="9" y="64" width="22" height="4" rx="0.8" />
        <path d="M13 68 H27 L22.5 76 H17.5 Z" />
        <circle cx="20" cy="80" r="2.4" />
      </g>
      <path d="M8 23 H32 L29 64 H11 Z" fill={`url(#${flame})`} />
      <g fill="none" stroke="#161412" strokeLinejoin="round">
        <path d="M8 23 H32 L29 64 H11 Z" strokeWidth="2.2" />
        <path d="M20 23 V64" strokeWidth="1.6" />
        <path d="M9.6 43 H30.4" strokeWidth="1.1" opacity="0.8" />
      </g>
    </svg>
  );
}

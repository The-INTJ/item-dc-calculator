import styles from './Oculus.module.scss';

/** Louver centres in a 100-unit box; six slats, as on the building's vent. */
const LOUVERS = [20.4, 32.2, 44, 55.8, 67.6, 79.4];
const SLAT_H = 8.4;

/**
 * The round louvered vent from Moriah's gable — the preview's home mark.
 * On hover its louvers part and the gaps glow, as if a lamp were lit inside.
 * `idPrefix` keeps gradient ids unique when the vent appears twice on a page.
 */
export function Oculus({ idPrefix, className }: { idPrefix: string; className?: string }) {
  const ring = `${idPrefix}-ring`;
  const lip = `${idPrefix}-lip`;
  const slat = `${idPrefix}-slat`;
  const clip = `${idPrefix}-clip`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${styles.oculus} ${className ?? ''}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={ring} x1="0.15" y1="0.08" x2="0.85" y2="0.95">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f1f1f2" />
          <stop offset="1" stopColor="#b5b9c9" />
        </linearGradient>
        <linearGradient id={lip} x1="0.85" y1="0.95" x2="0.15" y2="0.08">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#a7abbd" />
        </linearGradient>
        <linearGradient id={slat} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fefefc" />
          <stop offset="0.55" stopColor="#e8e9ee" />
          <stop offset="1" stopColor="#a4a8bb" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="35.5" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="48.6" fill={`url(#${ring})`} stroke="#8f94a9" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="41.5" fill={`url(#${lip})`} />
      <circle cx="50" cy="50" r="36.4" fill="#8e93a8" />
      <g clipPath={`url(#${clip})`}>
        <circle className={styles.vent} cx="50" cy="50" r="36" />
        {LOUVERS.map((y) => (
          <rect
            key={y}
            className={styles.louver}
            x="12"
            y={y - SLAT_H / 2}
            width="76"
            height={SLAT_H}
            rx="0.8"
            fill={`url(#${slat})`}
          />
        ))}
      </g>
    </svg>
  );
}

import type { LineKind, OverlayLine } from './overlayModel';
import styles from './Board.module.scss';

const ARROW_KINDS: readonly LineKind[] = ['rider', 'jumper', 'step', 'last'];

const COLOR: Record<LineKind, string> = {
  rider: 'var(--tr-rider)',
  jumper: 'var(--tr-jumper)',
  step: 'var(--tr-step)',
  last: 'var(--tr-last-line)',
  ghost: 'var(--tr-rider)',
};

/** One SVG over the whole board, one unit per square; never takes taps. */
export function BoardOverlay({ lines }: { lines: OverlayLine[] }) {
  return (
    <svg className={styles.overlay} viewBox="0 0 8 8" aria-hidden="true" focusable="false">
      <defs>
        {ARROW_KINDS.map((kind) => (
          <marker
            key={kind}
            id={`tracer-arrow-${kind}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="3.2"
            markerHeight="3.2"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" style={{ fill: COLOR[kind] }} />
          </marker>
        ))}
      </defs>
      {lines.map((line) => (
        <polyline
          key={line.key}
          points={line.points}
          className={`${styles.line} ${styles[`line_${line.kind}`]}`}
          style={{ stroke: COLOR[line.kind] }}
          markerEnd={line.arrow ? `url(#tracer-arrow-${line.kind})` : undefined}
        />
      ))}
    </svg>
  );
}

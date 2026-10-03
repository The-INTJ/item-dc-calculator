import { digitVector, parsePattern, type PatternCode } from '../../engine';

import styles from './Panels.module.scss';

interface Point {
  x: number;
  y: number;
}

/** Points of the path in board units, north up, starting at the origin. */
function pathPoints(code: PatternCode): { points: Point[]; jumper: boolean } {
  const pattern = parsePattern(code);
  if (!pattern) return { points: [{ x: 0, y: 0 }], jumper: false };
  if (pattern.kind === 'jumper') {
    return { points: [{ x: 0, y: 0 }, { x: pattern.dx, y: pattern.dy }], jumper: true };
  }
  const points = [{ x: 0, y: 0 }];
  for (const digit of pattern.steps) {
    const last = points[points.length - 1];
    const { dx, dy } = digitVector(digit);
    points.push({ x: last.x + dx, y: last.y + dy });
  }
  return { points, jumper: false };
}

/**
 * A pattern drawn small: the start as a dot, the path (solid for riders,
 * dashed for jumpers) and a ring where it lands. One orientation is shown;
 * all eight rotations and mirrors are equally legal.
 */
export function PatternDiagram({ code, label }: { code: PatternCode; label: string }) {
  const { points, jumper } = pathPoints(code);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => -p.y);
  const minX = Math.min(...xs) - 0.7;
  const minY = Math.min(...ys) - 0.7;
  const size = Math.max(Math.max(...xs) - minX + 0.7, Math.max(...ys) - minY + 0.7, 2.4);
  const end = points[points.length - 1];
  return (
    <svg className={styles.diagram} viewBox={`${minX} ${minY} ${size} ${size}`} role="img" aria-label={label}>
      <polyline
        points={points.map((p) => `${p.x},${-p.y}`).join(' ')}
        className={jumper ? styles.diagramJumper : styles.diagramRider}
        strokeDasharray={jumper ? '0.25 0.18' : undefined}
      />
      <circle cx={0} cy={0} r={0.22} className={styles.diagramStart} />
      <circle cx={end.x} cy={-end.y} r={0.3} className={jumper ? styles.diagramLandJ : styles.diagramLandR} />
    </svg>
  );
}

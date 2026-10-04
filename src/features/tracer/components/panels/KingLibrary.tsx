import type { Side } from '../../engine';
import { patternLabel, seatName } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

/** One king's library: every pattern its side has ever charted, first-charted first. */
export function KingLibrary({ game, side }: { game: TracerGame; side: Side }) {
  const keys = game.state.chartedKeys[side];
  return (
    <section className={styles.library}>
      <h3 className={styles.libraryTitle}>
        {seatName(game, side)}’s king · {keys.length} pattern{keys.length === 1 ? '' : 's'}
      </h3>
      {keys.length === 0 ? (
        <p className={styles.muted}>Nothing yet — every Tracer chart teaches this king its pattern.</p>
      ) : (
        <ul className={styles.libraryGrid}>
          {keys.map((key) => (
            <li key={key} className={styles.libraryItem}>
              <PatternDiagram code={key} label={patternLabel(key)} />
              <span>{patternLabel(key)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

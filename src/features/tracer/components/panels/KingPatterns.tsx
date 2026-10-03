import { STARTING_LAYOUT, type Side } from '../../engine';
import { patternLabel, seatName } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

/** The three Tracer slots, shortest reach first. */
const TRACER_SLOTS = STARTING_LAYOUT.filter((placement) => placement.kind === 'tracer').sort(
  (a, b) => (a.range ?? 0) - (b.range ?? 0),
);

function slotStatus(alive: boolean, hasPattern: boolean): string {
  if (!hasPattern) return 'not charted yet';
  return alive ? 'current pattern' : 'kept after its capture';
}

function KingSide({ game, side }: { game: TracerGame; side: Side }) {
  const lent = game.state.kingPatterns[side];
  return (
    <section className={styles.library}>
      <h3 className={styles.libraryTitle}>{seatName(game, side)}’s king borrows</h3>
      <ul className={styles.libraryGrid}>
        {TRACER_SLOTS.map((slot) => {
          const id = `${side}${slot.id}`;
          const pattern = lent[id] ?? null;
          const alive = game.state.pieces.some((piece) => piece.id === id);
          return (
            <li key={id} className={styles.libraryItem}>
              {pattern ? (
                <PatternDiagram code={pattern} label={patternLabel(pattern)} />
              ) : (
                <span className={styles.emptySlot} aria-hidden="true" />
              )}
              <span className={styles.strong}>{slot.range}-step</span>
              <span>{pattern ? patternLabel(pattern) : '—'}</span>
              <span className={styles.muted}>{slotStatus(alive, pattern !== null)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * What each king can do besides its one-square step: one pattern per Tracer
 * — the Tracer's current one, or its last one if it was captured.
 */
export function KingPatterns({ game, firstSide }: { game: TracerGame; firstSide: Side }) {
  const second: Side = firstSide === 'w' ? 'b' : 'w';
  return (
    <div className={styles.libraries}>
      <KingSide game={game} side={firstSide} />
      <KingSide game={game} side={second} />
    </div>
  );
}

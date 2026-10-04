import { otherSide, type PatternCode, type Placement, type Side } from '../../engine';
import { patternLabel, seatName } from '../../lib/presentation/gameText';
import { shownLimit } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import { KingLibrary } from './KingLibrary';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

/** The layout's Tracers, shortest reach first. */
function tracerSlots(game: TracerGame): Placement[] {
  const tier = (p: Placement) => p.tier ?? Number.MAX_SAFE_INTEGER;
  return game.state.rules.layout.pieces.filter((p) => p.kind === 'tracer').sort((a, b) => tier(a) - tier(b));
}

/** The pattern a Tracer slot lends its king, and how to describe it. */
function slotState(game: TracerGame, side: Side, id: string): { pattern: PatternCode | null; status: string } {
  const piece = game.state.pieces.find((p) => p.id === id);
  if (piece) return { pattern: piece.pattern, status: piece.pattern ? 'current pattern' : 'not charted yet' };
  const kept = game.state.rules.kingMemory === 'current-kept' ? (game.state.lastCharted[side][id] ?? null) : null;
  if (kept) return { pattern: kept, status: 'kept after its capture' };
  return { pattern: null, status: 'captured — nothing to lend' };
}

function SlotLabel({ game, slot, side }: { game: TracerGame; slot: Placement; side: Side }) {
  const limit = shownLimit(game.state.rules, slot);
  const square = `${slot.file}${side === 'w' ? 1 + slot.row : 8 - slot.row}`;
  return <span className={styles.strong}>{limit !== null ? `${limit}-step` : `Tracer from ${square}`}</span>;
}

/** One king's borrowed patterns: a slot per Tracer of the layout. */
function KingSlots({ game, side }: { game: TracerGame; side: Side }) {
  return (
    <section className={styles.library}>
      <h3 className={styles.libraryTitle}>{seatName(game, side)}’s king borrows</h3>
      <ul className={styles.libraryGrid}>
        {tracerSlots(game).map((slot) => {
          const id = `${side}${slot.id}`;
          const { pattern, status } = slotState(game, side, id);
          return (
            <li key={id} className={styles.libraryItem}>
              {pattern ? (
                <PatternDiagram code={pattern} label={patternLabel(pattern)} />
              ) : (
                <span className={styles.emptySlot} aria-hidden="true" />
              )}
              <SlotLabel game={game} slot={slot} side={side} />
              <span>{pattern ? patternLabel(pattern) : '—'}</span>
              <span className={styles.muted}>{status}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * What each king can do besides its one-square step, shown the way this
 * game's king-memory rule works: a library of everything charted, a slot
 * per Tracer, or nothing at all.
 */
export function KingPatterns({ game, firstSide }: { game: TracerGame; firstSide: Side }) {
  const memory = game.state.rules.kingMemory;
  if (memory === 'none') {
    return <p className={styles.muted}>In this game the kings borrow no patterns — they step one square at a time.</p>;
  }
  const KingSide = memory === 'every-chart' ? KingLibrary : KingSlots;
  return (
    <div className={styles.libraries}>
      <KingSide game={game} side={firstSide} />
      <KingSide game={game} side={otherSide(firstSide)} />
    </div>
  );
}

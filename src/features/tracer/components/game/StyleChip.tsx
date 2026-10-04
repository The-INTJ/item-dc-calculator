import { gameStyleLabel } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import styles from './Game.module.scss';

/** The game's style and how many rules it changed — opens the Rules tab. */
export function StyleChip({ game, onOpen }: { game: TracerGame; onOpen: () => void }) {
  const label = gameStyleLabel(game);
  return (
    <button type="button" className={styles.styleChip} aria-label={`Rules: ${label}`} onClick={onOpen}>
      Rules: {label}
    </button>
  );
}

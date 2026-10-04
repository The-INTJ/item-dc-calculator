import { useId } from 'react';

import type { GameSetupControls } from '../../hooks/useGameSetup';
import { GAME_STYLES } from '../../variants';
import styles from './GameSetup.module.scss';

/** The game style dropdown, with a line on how the chosen style plays. */
export function StylePicker({ controls }: { controls: GameSetupControls }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Game style</label>
      <select
        id={id}
        className={styles.select}
        value={controls.style.id}
        onChange={(event) => controls.pickStyle(event.target.value)}
      >
        {GAME_STYLES.map((style) => (
          <option key={style.id} value={style.id}>
            {style.name}
          </option>
        ))}
      </select>
      <p className={styles.summary}>{controls.style.summary}</p>
      {controls.ignored.length > 0 && (
        <p className={styles.notice} role="status">
          Some of this link’s settings could not be used ({controls.ignored.join(', ')}).
        </p>
      )}
    </div>
  );
}

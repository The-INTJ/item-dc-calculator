import { gameStyleLabel, gameTweaks } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import { describeRule, TOGGLE_KEYS } from '../../variants';
import { RuleSections } from './RuleSections';
import styles from './Panels.module.scss';

/**
 * The Rules tab: this game's rules in a line each — marked where they differ
 * from the style it started from — then how to play under them.
 */
export function GameRules({ game }: { game: TracerGame }) {
  const rules = game.state.rules;
  const tweaks = gameTweaks(game);
  return (
    <div className={styles.rules}>
      <section aria-labelledby="tracer-game-rules">
        <h3 id="tracer-game-rules">This game · {gameStyleLabel(game)}</h3>
        <ul>
          {TOGGLE_KEYS.map((key) => (
            <li key={key}>
              {describeRule(key, rules)}
              {tweaks.includes(key) && <span className={styles.changed}>changed</span>}
            </li>
          ))}
        </ul>
      </section>
      <RuleSections rules={rules} />
    </div>
  );
}

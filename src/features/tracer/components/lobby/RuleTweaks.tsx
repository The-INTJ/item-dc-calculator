import { useState } from 'react';

import type { RuleSet } from '../../engine';
import { setupUrl, type GameSetupControls } from '../../hooks/useGameSetup';
import { TOGGLE_KEYS, TOGGLES, type ToggleGroup } from '../../variants';
import { shareLink } from '../game/shareLink';
import { RuleControl } from './RuleControl';
import styles from './GameSetup.module.scss';

/** Toggles by group, in registry order. */
function groups(): [ToggleGroup, (keyof RuleSet)[]][] {
  const byGroup = new Map<ToggleGroup, (keyof RuleSet)[]>();
  for (const key of TOGGLE_KEYS) {
    const group = TOGGLES[key].group;
    byGroup.set(group, [...(byGroup.get(group) ?? []), key]);
  }
  return [...byGroup.entries()];
}

/**
 * "Customize rules": every rule the chosen style sets, grouped, each with its
 * own reset when changed — plus a reset for all and a link that carries this
 * exact setup to a friend.
 */
export function RuleTweaks({ controls }: { controls: GameSetupControls }) {
  const changed = controls.tweaks.length;
  const [open, setOpen] = useState(changed > 0);
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    const outcome = await shareLink('A Tracer setup to try', setupUrl(controls.setup));
    setNote(outcome === 'copied' ? 'Setup link copied — send it to a friend.' : outcome === 'failed' ? 'Could not share the link.' : null);
  }

  return (
    <details className={styles.tweaks} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Customize rules{changed > 0 && ` (${changed} changed)`}</summary>
      {groups().map(([group, keys]) => (
        <fieldset key={group} className={styles.group}>
          <legend>{group}</legend>
          {keys.map((key) => (
            <RuleControl key={key} ruleKey={key} controls={controls} />
          ))}
        </fieldset>
      ))}
      <div className={styles.row}>
        <button type="button" className={styles.quiet} disabled={changed === 0} onClick={controls.resetAll}>
          Reset to {controls.style.name}
        </button>
        <button type="button" className={styles.quiet} onClick={() => void share()}>
          Share setup link
        </button>
      </div>
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}
    </details>
  );
}

import type { Layout, RuleSet } from '../../engine';
import { MAX_PATH_LENGTH } from '../../engine';
import { tierSquares } from '../../variants';
import styles from './GameSetup.module.scss';

type Reach = RuleSet['tracerReach'];

interface TracerReachControlProps {
  id: string;
  reach: Reach;
  layout: Layout;
  disabled: boolean;
  onChange: (reach: Reach) => void;
}

/**
 * Step limits: on or off, then one limit per Tracer tier, labelled with the
 * squares those Tracers start on in the chosen layout. An empty box means
 * that tier has no limit.
 */
export function TracerReachControl({ id, reach, layout, disabled, onChange }: TracerReachControlProps) {
  const setLimit = (tier: number, text: string) => {
    const limits = [...reach.limits];
    while (limits.length <= tier) limits.push(null);
    const n = Math.round(Number(text));
    limits[tier] = text === '' ? null : Math.min(MAX_PATH_LENGTH, Math.max(1, n));
    onChange({ ...reach, limits });
  };
  return (
    <div className={styles.rule}>
      <label className={styles.switch}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={reach.limited}
          disabled={disabled}
          onChange={(event) => onChange({ ...reach, limited: event.target.checked })}
        />
        {reach.limited ? 'Limited' : 'Any length'}
      </label>
      {reach.limited && (
        <div className={styles.tiers}>
          {tierSquares(layout).map(({ tier, squares }) => (
            <label key={tier}>
              Tracer on {squares.join(', ')}
              <input
                className={styles.number}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PATH_LENGTH}
                placeholder="No limit"
                value={reach.limits[tier] ?? ''}
                disabled={disabled}
                onChange={(event) => setLimit(tier, event.target.value)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

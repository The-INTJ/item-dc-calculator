import { useId } from 'react';

import type { RuleSet } from '../../engine';
import type { GameSetupControls } from '../../hooks/useGameSetup';
import { layoutById, LAYOUTS, TOGGLES, type AnyControl } from '../../variants';
import { TracerReachControl } from './TracerReachControl';
import styles from './GameSetup.module.scss';

interface InputProps {
  id: string;
  control: AnyControl;
  value: unknown;
  rules: RuleSet;
  disabled: boolean;
  onChange: (value: unknown) => void;
}

function ControlInput({ id, control, value, rules, disabled, onChange }: InputProps) {
  switch (control.kind) {
    case 'switch':
      return (
        <label className={styles.switch}>
          <input id={id} type="checkbox" role="switch" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
          {value === true ? 'On' : 'Off'}
        </label>
      );
    case 'choice':
      return (
        <select id={id} className={styles.select} value={String(value)} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          {Object.entries(control.options).map(([option, label]) => (
            <option key={option} value={option}>
              {label}
            </option>
          ))}
        </select>
      );
    case 'number': {
      const clamp = (n: number) => Math.min(control.max, Math.max(control.min, Math.round(n)));
      return (
        <input
          id={id}
          className={styles.number}
          type="number"
          inputMode="numeric"
          min={control.min}
          max={control.max}
          value={Number(value)}
          disabled={disabled}
          onChange={(event) => event.target.value !== '' && onChange(clamp(Number(event.target.value)))}
        />
      );
    }
    case 'custom':
      if (control.id === 'tracer-reach') {
        return <TracerReachControl id={id} reach={rules.tracerReach} layout={rules.layout} disabled={disabled} onChange={onChange} />;
      }
      return (
        <select id={id} className={styles.select} value={rules.layout.id} disabled={disabled} onChange={(event) => onChange(layoutById(event.target.value))}>
          {LAYOUTS.map((layout) => (
            <option key={layout.id} value={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      );
  }
}

/** One rule: its control, whether it differs from the style (with a reset), and a line of help. */
export function RuleControl({ ruleKey, controls }: { ruleKey: keyof RuleSet; controls: GameSetupControls }) {
  const id = useId();
  const toggle = TOGGLES[ruleKey];
  const rules = controls.setup.rules;
  const inert = toggle.inert(rules);
  const changed = controls.tweaks.includes(ruleKey);
  const control = toggle.control as AnyControl;
  const zero = control.kind === 'number' && rules[ruleKey] === 0 ? control.zeroLabel : null;
  return (
    <div className={styles.rule}>
      <div className={styles.ruleHead}>
        <label htmlFor={id}>
          {toggle.label}
          {zero && ` (${zero})`}
          {changed && <span className={styles.changedDot} title="Changed from the style" />}
        </label>
        {changed && (
          <button type="button" className={styles.reset} aria-label={`Reset ${toggle.label}`} onClick={() => controls.resetRule(ruleKey)}>
            Reset
          </button>
        )}
      </div>
      <ControlInput
        id={id}
        control={control}
        value={rules[ruleKey]}
        rules={rules}
        disabled={inert !== null}
        onChange={(value) => value !== null && controls.setRule(ruleKey, value as never)}
      />
      <p className={styles.help}>{inert ?? toggle.help}</p>
    </div>
  );
}

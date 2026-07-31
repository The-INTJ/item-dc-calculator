'use client';

import styles from './WateringWeightModal.module.scss';

interface WeightFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  autoFocus?: boolean;
}

function WeightField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  autoFocus,
}: WeightFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={80}
        autoFocus={autoFocus}
        disabled={disabled}
      />
    </label>
  );
}

interface WateringWeightFieldsProps {
  weightBefore: string;
  weightAfter: string;
  onWeightBefore: (value: string) => void;
  onWeightAfter: (value: string) => void;
  saving: boolean;
}

/**
 * Both weights and the confirm, on one row. Free text rather than a number
 * input — people record what their scale says, units and all.
 */
export function WateringWeightFields({
  weightBefore,
  weightAfter,
  onWeightBefore,
  onWeightAfter,
  saving,
}: WateringWeightFieldsProps) {
  return (
    <div className={styles.fields}>
      <WeightField
        label="Before"
        value={weightBefore}
        onChange={onWeightBefore}
        placeholder="e.g. 410 g"
        disabled={saving}
        autoFocus
      />
      <WeightField
        label="After"
        value={weightAfter}
        onChange={onWeightAfter}
        placeholder="e.g. 690 g"
        disabled={saving}
      />
      <button
        type="submit"
        className={styles.check}
        aria-label="Save watering weights"
        disabled={saving}
      >
        {saving ? '...' : '✓'}
      </button>
    </div>
  );
}

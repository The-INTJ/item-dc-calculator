'use client';

import { Slider } from '@mui/material';
import type { AttributeConfig } from '../../../contexts/contest/contestTypes';

interface VoteCategorySliderProps {
  category: AttributeConfig;
  entryId: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

/** One scoring category, from its floor to its ceiling. */
export function VoteCategorySlider({
  category,
  entryId,
  value,
  disabled,
  onChange,
}: VoteCategorySliderProps) {
  const min = category.min ?? 0;
  const max = category.max ?? 10;
  const fieldId = `score-${entryId}-${category.id}`;

  return (
    <div className="contest-vote-slider">
      <div className="contest-vote-slider__label-row">
        <label className="contest-vote-slider__label" htmlFor={fieldId}>
          {category.label}
        </label>
        <span className="contest-vote-slider__value">
          {value}
          <span> / {max}</span>
        </span>
      </div>
      <Slider
        id={fieldId}
        className="contest-vote-slider__field"
        min={min}
        max={max}
        step={1}
        value={value}
        valueLabelDisplay="auto"
        disabled={disabled}
        onChange={(_, nextValue) => {
          if (disabled) return;
          onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue);
        }}
      />
      <div className="contest-vote-slider__scale" aria-hidden="true">
        <span>Poor</span>
        <span>Average</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

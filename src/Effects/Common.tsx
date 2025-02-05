// /Effects/Common.js

import React from 'react';
import values, { Effect, FrequencyType, ComplexityType, ResistanceType, DurationType } from '../values'; // adjust path if needed
import { TextField, Select, SelectChangeEvent, Checkbox as MUICheckbox } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';

/**
 * Common pickers used across multiple effect types.
 */

export type GeneralEffectUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: keyof Effect, value: any) => void;
}

// Die Value Picker
export function DieValuePicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>Die Value:</InputLabel>
      <Select 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        defaultValue={values.dieBonusValues[0]}
        size='small'
      >
        {values.dieBonusValues.map((dieOption) => (
          <MenuItem key={dieOption} value={dieOption}>
            {dieOption}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

// Die Amount Picker
export function DieAmountPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="effect-field">
      <label>Die Amount:</label>
      <TextField
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        variant="standard"
      />
    </div>
  );
}

// Frequency Picker
export function FrequencyPicker({ value, onChange, optionalTitle }: { value: FrequencyType; onChange: (value: FrequencyType) => void; optionalTitle?: string | boolean }) {
  return (
    <div className="effect-field">
      <InputLabel>{optionalTitle || "Frequency:"}</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value as FrequencyType)} size='small'>
        {Object.keys(values.frequencyModifiers).map((freqKey) => (
          <MenuItem key={freqKey} value={freqKey}>
            {freqKey}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

// Value Input (generic numeric input)
export function ValueInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  noZero(value, onChange);
  return (
    <div className="effect-field">
      <label>{label}</label>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// Power Level Picker
export function PowerLevelPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="effect-field">
      <label>Power Level:</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {values.powerLevelModifiers.map((modifier, i) => (
          <option key={i} value={i}>
            {`Index ${i} => x${modifier}`}
          </option>
        ))}
      </select>
    </div>
  );
}

// Complexity Picker
export function ComplexityPicker({ value, onChange }: { value: ComplexityType; onChange: (value: ComplexityType) => void }) {
  return (
    <div className="effect-field">
      <label>Useable:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as ComplexityType)}>
        {Object.keys(values.complexityModifiers).map((compKey) => (
          <option key={compKey} value={compKey}>
            {compKey}
          </option>
        ))}
      </select>
    </div>
  );
}

// Resistance Picker
export function ResistancePicker({ value, onChange }: { value: ResistanceType; onChange: (value: ResistanceType) => void }) {
  return (
    <div className="effect-field">
      <label>Type:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as ResistanceType)}>
        {Object.keys(values.resistanceRarity).map((compKey) => (
          <option key={compKey} value={compKey}>
            {compKey}
          </option>
        ))}
      </select>
    </div>
  );
}

// Duration Picker
export function DurationPicker({ value, onChange }: { value: DurationType; onChange: (value: DurationType) => void }) {
  return (
    <div className="effect-field">
      <label>Duration:</label>
      <select value={value} onChange={(e) => onChange(e.target.value as DurationType)}>
        {Object.keys(values.durationValues).map((compKey) => (
          <option key={compKey} value={compKey}>
            {compKey}
          </option>
        ))}
      </select>
    </div>
  );
}

// Universal Checkbox
export function Checkbox({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  const formedLabel = { inputProps: {'aria-label': label}};
  return (
    <div className="effect-field checkbox">
      <InputLabel>{label}</InputLabel>
      <MUICheckbox
        {...formedLabel}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

/**
 * Helpers
 */

function noZero(value: number, onChange: (value: number) => void) {
  if (value < 1) {
    onChange(1);
  }
}
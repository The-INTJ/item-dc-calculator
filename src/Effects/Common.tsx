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
      <InputLabel>Die Amount:</InputLabel>
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
      <InputLabel>{label}</InputLabel>
      <TextField
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        variant="standard"
      />
    </div>
  );
}

// Generic numeric input that allows any value (including negatives). Useful for
// optional overrides or future numeric fields that shouldn't be clamped.
export function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>{label}</InputLabel>
      <TextField
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        variant="standard"
      />
    </div>
  );
}

// Power Level Picker
export function PowerLevelPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>Power Level:</InputLabel>
      <Select value={String(value)} onChange={(e) => onChange(Number(e.target.value))} size='small'>
        {values.powerLevelModifiers.map((modifier, i) => (
          <MenuItem key={i} value={i}>
            {`Index ${i} => x${modifier}`}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

// Complexity Picker
export function ComplexityPicker({ value, onChange }: { value: ComplexityType; onChange: (value: ComplexityType) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>Useable:</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value as ComplexityType)} size='small'>
        {Object.keys(values.complexityModifiers).map((compKey) => (
          <MenuItem key={compKey} value={compKey}>
            {compKey}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

// Resistance Picker
export function ResistancePicker({ value, onChange }: { value: ResistanceType; onChange: (value: ResistanceType) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>Type:</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value as ResistanceType)} size='small'>
        {Object.keys(values.resistanceRarity).map((compKey) => (
          <MenuItem key={compKey} value={compKey}>
            {compKey}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
}

// Duration Picker
export function DurationPicker({ value, onChange }: { value: DurationType; onChange: (value: DurationType) => void }) {
  return (
    <div className="effect-field">
      <InputLabel>Duration:</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value as DurationType)} size='small'>
        {Object.keys(values.durationValues).map((compKey) => (
          <MenuItem key={compKey} value={compKey}>
            {compKey}
          </MenuItem>
        ))}
      </Select>
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
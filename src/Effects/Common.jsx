// /Effects/Common.js

import React from 'react';
import values from '../values'; // adjust path if needed

/**
 * Common pickers used across multiple effect types.
 */

// Die Value Picker
export function DieValuePicker({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Die Value:</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {values.dieBonusValues.map((dieOption) => (
          <option key={dieOption} value={dieOption}>
            {dieOption}
          </option>
        ))}
      </select>
    </div>
  );
}

// Die Amount Picker
export function DieAmountPicker({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Die Amount:</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// Frequency Picker
export function FrequencyPicker({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Frequency:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(values.frequencyModifiers).map((freqKey) => (
          <option key={freqKey} value={freqKey}>
            {freqKey}
          </option>
        ))}
      </select>
    </div>
  );
}

// Value Input (generic numeric input)
export function ValueInput({ label, value, onChange }) {
  return (
    <div className="effect-field">
      <label>{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// Power Level Picker
export function PowerLevelPicker({ value, onChange }) {
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
export function ComplexityPicker({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Complexity:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(values.complexityModifiers).map((compKey) => (
          <option key={compKey} value={compKey}>
            {compKey}
          </option>
        ))}
      </select>
    </div>
  );
}

// IsArmor Checkbox
export function IsArmorCheckbox({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Is Armor?</label>
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}
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
export function FrequencyPicker({ value, onChange, optionalTitle }) {
  return (
    <div className="effect-field">
      <label>{optionalTitle || "Frequency:"}</label>
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
      <label>Useable:</label>
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

// Resistance Picker
export function ResistancePicker({ value, onChange }) {
  console.log('value:', value);
  return (
    <div className="effect-field">
      <label>Type:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
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
export function DurationPicker({ value, onChange }) {
  return (
    <div className="effect-field">
      <label>Duration:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
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

export function Checkbox({ value, onChange, title }) {
  return (
    <div className="effect-field">
      <label>{title}</label>
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

/**
 * Helpers
 */

function noZero(value, onChange) {
  if (value < 1) {
    onChange(1);
  }
}
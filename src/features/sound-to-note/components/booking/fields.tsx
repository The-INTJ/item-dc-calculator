import type { ChangeEvent } from 'react';

import { services } from '../../content';
import chip from '../../styles/chip.module.scss';
import f from '../../styles/form.module.scss';

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className={f.fieldLabel}>
      {label}
      {required && <span className={f.required}> *</span>}
    </span>
  );
}

export function TextField({
  type = 'text',
  multiline = false,
  ...props
}: FieldProps & { type?: string; multiline?: boolean }) {
  const shared = {
    name: props.name,
    value: props.value,
    required: props.required,
    placeholder: props.placeholder,
    className: f.control,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      props.onChange(e.target.value),
  };
  return (
    <label className={f.field}>
      <FieldLabel label={props.label} required={props.required} />
      {multiline ? <textarea rows={5} {...shared} /> : <input type={type} {...shared} />}
    </label>
  );
}

export function SelectField({ options, ...props }: FieldProps & { options: readonly string[] }) {
  return (
    <label className={f.field}>
      <FieldLabel label={props.label} required={props.required} />
      <span className={f.selectWrap}>
        <select
          name={props.name}
          value={props.value}
          required={props.required}
          className={f.control}
          onChange={(e) => props.onChange(e.target.value)}
        >
          <option value="">Choose one</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className={f.caret} aria-hidden="true">
          ▼
        </span>
      </span>
    </label>
  );
}

/** A real checkbox wearing the CheckChip look, so forms and screen readers get it right. */
export function CheckChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`${chip.chip} ${checked ? chip.checked : ''}`}>
      <input
        type="checkbox"
        className={chip.input}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={chip.box} aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      {label}
    </label>
  );
}

/** "Services requested" — one CheckChip per service, as a labelled group. */
export function ServicesPicker({
  picked,
  onChange,
}: {
  picked: string[];
  onChange: (picked: string[]) => void;
}) {
  return (
    <fieldset className={`${f.full} ${f.services}`}>
      <legend className={f.fieldLabel}>Services requested</legend>
      <div className={f.chips}>
        {services.map(({ label }) => (
          <CheckChip
            key={label}
            label={label}
            checked={picked.includes(label)}
            onChange={(on) => onChange(on ? [...picked, label] : picked.filter((x) => x !== label))}
          />
        ))}
      </div>
    </fieldset>
  );
}

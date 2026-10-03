import { useId } from 'react';

import { DISPLAY_NAME_MAX } from '../../lib/schemas';
import styles from './NameField.module.scss';

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** "Your name" — what the other player sees on their board. */
export function NameField({ value, onChange }: NameFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Your name</label>
      <input
        id={id}
        className={styles.input}
        value={value}
        maxLength={DISPLAY_NAME_MAX}
        autoComplete="nickname"
        enterKeyHint="go"
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

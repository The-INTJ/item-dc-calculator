'use client';

interface AuthFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}

/** A labelled credential input. Every auth field is required. */
export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
}: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        autoComplete={autoComplete}
      />
    </div>
  );
}

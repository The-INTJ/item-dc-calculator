'use client';

/**
 * ContestLabelFields - The shared singular/plural vocabulary rows (entry and
 * contestant labels) used by both the template and custom config setup modes.
 */

function LabelField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="admin-contest-setup-form__field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        className="admin-rounds-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

interface ContestLabelFieldsProps {
  idPrefix: string;
  entryLabel: string;
  onEntryLabelChange: (label: string) => void;
  entryLabelPlural: string;
  onEntryLabelPluralChange: (label: string) => void;
  contestantLabel: string;
  onContestantLabelChange: (label: string) => void;
  contestantLabelPlural: string;
  onContestantLabelPluralChange: (label: string) => void;
  entryPlaceholder: string;
  entryPluralPlaceholder: string;
  contestantPlaceholder: string;
  contestantPluralPlaceholder: string;
  disabled: boolean;
}

export function ContestLabelFields({
  idPrefix,
  entryLabel,
  onEntryLabelChange,
  entryLabelPlural,
  onEntryLabelPluralChange,
  contestantLabel,
  onContestantLabelChange,
  contestantLabelPlural,
  onContestantLabelPluralChange,
  entryPlaceholder,
  entryPluralPlaceholder,
  contestantPlaceholder,
  contestantPluralPlaceholder,
  disabled,
}: ContestLabelFieldsProps) {
  return (
    <>
      <div className="admin-contest-setup-form__row">
        <LabelField
          id={`${idPrefix}-entry-label`}
          label="Entry Label"
          value={entryLabel}
          onChange={onEntryLabelChange}
          placeholder={entryPlaceholder}
          disabled={disabled}
        />
        <LabelField
          id={`${idPrefix}-entry-label-plural`}
          label="Plural"
          value={entryLabelPlural}
          onChange={onEntryLabelPluralChange}
          placeholder={entryPluralPlaceholder}
          disabled={disabled}
        />
      </div>

      <div className="admin-contest-setup-form__row">
        <LabelField
          id={`${idPrefix}-contestant-label`}
          label="Contestant Label"
          value={contestantLabel}
          onChange={onContestantLabelChange}
          placeholder={contestantPlaceholder}
          disabled={disabled}
        />
        <LabelField
          id={`${idPrefix}-contestant-label-plural`}
          label="Plural"
          value={contestantLabelPlural}
          onChange={onContestantLabelPluralChange}
          placeholder={contestantPluralPlaceholder}
          disabled={disabled}
        />
      </div>
    </>
  );
}

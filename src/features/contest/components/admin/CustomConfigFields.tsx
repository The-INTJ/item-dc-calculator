'use client';

/**
 * CustomConfigFields - Custom mode of the contest config setup: topic, labels,
 * scoring attributes, and the save-as-template opt-in.
 */

import { AttributeEditor } from './AttributeEditor';
import { ContestLabelFields } from './ContestLabelFields';
import type { AttributeConfig } from '../../contexts/contest/contestTypes';

interface CustomConfigFieldsProps {
  customTopic: string;
  onCustomTopicChange: (topic: string) => void;
  customAttributes: AttributeConfig[];
  onCustomAttributesChange: (attrs: AttributeConfig[]) => void;
  entryLabel: string;
  onEntryLabelChange: (label: string) => void;
  entryLabelPlural: string;
  onEntryLabelPluralChange: (label: string) => void;
  contestantLabel: string;
  onContestantLabelChange: (label: string) => void;
  contestantLabelPlural: string;
  onContestantLabelPluralChange: (label: string) => void;
  saveAsTemplate: boolean;
  onSaveAsTemplateChange: (save: boolean) => void;
  disabled: boolean;
}

export function CustomConfigFields({
  customTopic,
  onCustomTopicChange,
  customAttributes,
  onCustomAttributesChange,
  entryLabel,
  onEntryLabelChange,
  entryLabelPlural,
  onEntryLabelPluralChange,
  contestantLabel,
  onContestantLabelChange,
  contestantLabelPlural,
  onContestantLabelPluralChange,
  saveAsTemplate,
  onSaveAsTemplateChange,
  disabled,
}: CustomConfigFieldsProps) {
  return (
    <>
      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-topic">Topic / Contest Type</label>
        <input
          id="contest-topic"
          type="text"
          className="admin-rounds-input"
          value={customTopic}
          onChange={(event) => onCustomTopicChange(event.target.value)}
          placeholder="e.g. Chili Cook-Off, Dance Battle"
          disabled={disabled}
          required
        />
      </div>

      <ContestLabelFields
        idPrefix="custom"
        entryLabel={entryLabel}
        onEntryLabelChange={onEntryLabelChange}
        entryLabelPlural={entryLabelPlural}
        onEntryLabelPluralChange={onEntryLabelPluralChange}
        contestantLabel={contestantLabel}
        onContestantLabelChange={onContestantLabelChange}
        contestantLabelPlural={contestantLabelPlural}
        onContestantLabelPluralChange={onContestantLabelPluralChange}
        entryPlaceholder="Entry"
        entryPluralPlaceholder="Entries"
        contestantPlaceholder="Contestant"
        contestantPluralPlaceholder="Contestants"
        disabled={disabled}
      />

      <div className="admin-contest-setup-form__field">
        <label>Scoring Attributes</label>
        <AttributeEditor
          attributes={customAttributes}
          onChange={onCustomAttributesChange}
          disabled={disabled}
        />
      </div>

      <div className="admin-contest-setup-form__field">
        <label className="admin-contest-setup-form__checkbox-label">
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(event) => onSaveAsTemplateChange(event.target.checked)}
            disabled={disabled}
          />
          Save as Template
        </label>
      </div>
    </>
  );
}

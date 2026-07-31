'use client';

/**
 * TemplateConfigFields - Template mode of the contest config setup: pick an
 * existing config template, override its labels, preview the result.
 */

import { ContestConfigPreview } from './ContestConfigPreview';
import { ContestLabelFields } from './ContestLabelFields';
import type { ContestConfigItem } from '../../contexts/contest/contestTypes';
import { buildContestConfigFromTemplate } from '../../lib/domain/contestConfigDraft';

interface TemplateConfigFieldsProps {
  configs: ContestConfigItem[];
  configsLoading: boolean;
  configsError: string | null;
  selectedTemplate: string;
  onSelectedTemplateChange: (templateId: string) => void;
  entryLabel: string;
  onEntryLabelChange: (label: string) => void;
  entryLabelPlural: string;
  onEntryLabelPluralChange: (label: string) => void;
  contestantLabel: string;
  onContestantLabelChange: (label: string) => void;
  contestantLabelPlural: string;
  onContestantLabelPluralChange: (label: string) => void;
  disabled: boolean;
}

export function TemplateConfigFields({
  configs,
  configsLoading,
  configsError,
  selectedTemplate,
  onSelectedTemplateChange,
  entryLabel,
  onEntryLabelChange,
  entryLabelPlural,
  onEntryLabelPluralChange,
  contestantLabel,
  onContestantLabelChange,
  contestantLabelPlural,
  onContestantLabelPluralChange,
  disabled,
}: TemplateConfigFieldsProps) {
  const selectedConfig = configs.find((config) => config.id === selectedTemplate);
  const previewConfig = selectedConfig
    ? buildContestConfigFromTemplate(selectedConfig, {
        entryLabel,
        entryLabelPlural,
        contestantLabel,
        contestantLabelPlural,
      })
    : null;

  return (
    <>
      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-template">Contest Template</label>
        <select
          id="contest-template"
          className="admin-rounds-select"
          value={selectedTemplate}
          onChange={(event) => onSelectedTemplateChange(event.target.value)}
          disabled={configsLoading || disabled}
        >
          {configs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.topic}
            </option>
          ))}
        </select>
        {configsLoading ? (
          <span className="admin-detail-meta">Loading configs...</span>
        ) : null}
        {configsError ? (
          <p className="admin-phase-controls__message--error">{configsError}</p>
        ) : null}
      </div>

      <ContestLabelFields
        idPrefix="contest"
        entryLabel={entryLabel}
        onEntryLabelChange={onEntryLabelChange}
        entryLabelPlural={entryLabelPlural}
        onEntryLabelPluralChange={onEntryLabelPluralChange}
        contestantLabel={contestantLabel}
        onContestantLabelChange={onContestantLabelChange}
        contestantLabelPlural={contestantLabelPlural}
        onContestantLabelPluralChange={onContestantLabelPluralChange}
        entryPlaceholder={selectedConfig?.entryLabel ?? 'Entry'}
        entryPluralPlaceholder={selectedConfig?.entryLabelPlural ?? 'Entries'}
        contestantPlaceholder={selectedConfig?.contestantLabel ?? 'Contestant'}
        contestantPluralPlaceholder={selectedConfig?.contestantLabelPlural ?? 'Contestants'}
        disabled={disabled}
      />

      {previewConfig ? <ContestConfigPreview config={previewConfig} /> : null}
    </>
  );
}

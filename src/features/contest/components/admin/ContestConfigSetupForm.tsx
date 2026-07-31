'use client';

/**
 * ContestConfigSetupForm - Config section for creating a new contest.
 * Supports template selection or custom configuration.
 * Styled to align with ContestConfigEditor.
 */

import { CustomConfigFields } from './CustomConfigFields';
import { TemplateConfigFields } from './TemplateConfigFields';
import type { AttributeConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';

type ConfigMode = 'template' | 'custom';

interface ContestConfigSetupFormProps {
  configMode: ConfigMode;
  onConfigModeChange: (mode: ConfigMode) => void;
  configs: ContestConfigItem[];
  configsLoading: boolean;
  configsError: string | null;
  selectedTemplate: string;
  onSelectedTemplateChange: (templateId: string) => void;
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
  disabled?: boolean;
}

function ConfigModeToggle({
  configMode,
  onConfigModeChange,
  disabled,
}: {
  configMode: ConfigMode;
  onConfigModeChange: (mode: ConfigMode) => void;
  disabled: boolean;
}) {
  return (
    <div className="admin-contest-setup-form__field">
      <label>Configuration Mode</label>
      <div className="admin-contest-setup-form__mode-toggle">
        <button
          type="button"
          className={`button-secondary ${
            configMode === 'template' ? 'button-secondary--active' : ''
          }`}
          onClick={() => onConfigModeChange('template')}
          disabled={disabled}
        >
          Use Template
        </button>
        <button
          type="button"
          className={`button-secondary ${
            configMode === 'custom' ? 'button-secondary--active' : ''
          }`}
          onClick={() => onConfigModeChange('custom')}
          disabled={disabled}
        >
          Custom Config
        </button>
      </div>
    </div>
  );
}

export function ContestConfigSetupForm({
  configMode,
  onConfigModeChange,
  configs,
  configsLoading,
  configsError,
  selectedTemplate,
  onSelectedTemplateChange,
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
  disabled = false,
}: ContestConfigSetupFormProps) {
  return (
    <section className="admin-details-section">
      <div className="admin-contest-setup-form">
        <ConfigModeToggle
          configMode={configMode}
          onConfigModeChange={onConfigModeChange}
          disabled={disabled}
        />

        {configMode === 'template' ? (
          <TemplateConfigFields
            configs={configs}
            configsLoading={configsLoading}
            configsError={configsError}
            selectedTemplate={selectedTemplate}
            onSelectedTemplateChange={onSelectedTemplateChange}
            entryLabel={entryLabel}
            onEntryLabelChange={onEntryLabelChange}
            entryLabelPlural={entryLabelPlural}
            onEntryLabelPluralChange={onEntryLabelPluralChange}
            contestantLabel={contestantLabel}
            onContestantLabelChange={onContestantLabelChange}
            contestantLabelPlural={contestantLabelPlural}
            onContestantLabelPluralChange={onContestantLabelPluralChange}
            disabled={disabled}
          />
        ) : (
          <CustomConfigFields
            customTopic={customTopic}
            onCustomTopicChange={onCustomTopicChange}
            customAttributes={customAttributes}
            onCustomAttributesChange={onCustomAttributesChange}
            entryLabel={entryLabel}
            onEntryLabelChange={onEntryLabelChange}
            entryLabelPlural={entryLabelPlural}
            onEntryLabelPluralChange={onEntryLabelPluralChange}
            contestantLabel={contestantLabel}
            onContestantLabelChange={onContestantLabelChange}
            contestantLabelPlural={contestantLabelPlural}
            onContestantLabelPluralChange={onContestantLabelPluralChange}
            saveAsTemplate={saveAsTemplate}
            onSaveAsTemplateChange={onSaveAsTemplateChange}
            disabled={disabled}
          />
        )}
      </div>
    </section>
  );
}

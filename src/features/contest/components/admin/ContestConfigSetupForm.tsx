'use client';

/**
 * ContestConfigSetupForm - Config section for creating a new contest.
 * Supports template selection or custom configuration.
 * Styled to align with ContestConfigEditor.
 */

import React from 'react';
import { AttributeEditor } from './AttributeEditor';
import { ContestConfigPreview } from './ContestConfigPreview';
import type { AttributeConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import { buildContestConfigFromTemplate } from '../../lib/domain/contestConfigDraft';

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
    <section className="admin-details-section">
      <div className="admin-contest-setup-form">
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

        {configMode === 'template' ? (
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

            <div className="admin-contest-setup-form__row">
              <div className="admin-contest-setup-form__field">
                <label htmlFor="contest-entry-label">Entry Label</label>
                <input
                  id="contest-entry-label"
                  type="text"
                  className="admin-rounds-input"
                  value={entryLabel}
                  onChange={(event) => onEntryLabelChange(event.target.value)}
                  placeholder={selectedConfig?.entryLabel ?? 'Entry'}
                  disabled={disabled}
                />
              </div>
              <div className="admin-contest-setup-form__field">
                <label htmlFor="contest-entry-label-plural">Plural</label>
                <input
                  id="contest-entry-label-plural"
                  type="text"
                  className="admin-rounds-input"
                  value={entryLabelPlural}
                  onChange={(event) => onEntryLabelPluralChange(event.target.value)}
                  placeholder={selectedConfig?.entryLabelPlural ?? 'Entries'}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="admin-contest-setup-form__row">
              <div className="admin-contest-setup-form__field">
                <label htmlFor="contest-contestant-label">Contestant Label</label>
                <input
                  id="contest-contestant-label"
                  type="text"
                  className="admin-rounds-input"
                  value={contestantLabel}
                  onChange={(event) => onContestantLabelChange(event.target.value)}
                  placeholder={selectedConfig?.contestantLabel ?? 'Contestant'}
                  disabled={disabled}
                />
              </div>
              <div className="admin-contest-setup-form__field">
                <label htmlFor="contest-contestant-label-plural">Plural</label>
                <input
                  id="contest-contestant-label-plural"
                  type="text"
                  className="admin-rounds-input"
                  value={contestantLabelPlural}
                  onChange={(event) => onContestantLabelPluralChange(event.target.value)}
                  placeholder={selectedConfig?.contestantLabelPlural ?? 'Contestants'}
                  disabled={disabled}
                />
              </div>
            </div>

            {previewConfig ? <ContestConfigPreview config={previewConfig} /> : null}
          </>
        ) : (
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

            <div className="admin-contest-setup-form__row">
              <div className="admin-contest-setup-form__field">
                <label htmlFor="custom-entry-label">Entry Label</label>
                <input
                  id="custom-entry-label"
                  type="text"
                  className="admin-rounds-input"
                  value={entryLabel}
                  onChange={(event) => onEntryLabelChange(event.target.value)}
                  placeholder="Entry"
                  disabled={disabled}
                />
              </div>
              <div className="admin-contest-setup-form__field">
                <label htmlFor="custom-entry-label-plural">Plural</label>
                <input
                  id="custom-entry-label-plural"
                  type="text"
                  className="admin-rounds-input"
                  value={entryLabelPlural}
                  onChange={(event) => onEntryLabelPluralChange(event.target.value)}
                  placeholder="Entries"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="admin-contest-setup-form__row">
              <div className="admin-contest-setup-form__field">
                <label htmlFor="custom-contestant-label">Contestant Label</label>
                <input
                  id="custom-contestant-label"
                  type="text"
                  className="admin-rounds-input"
                  value={contestantLabel}
                  onChange={(event) => onContestantLabelChange(event.target.value)}
                  placeholder="Contestant"
                  disabled={disabled}
                />
              </div>
              <div className="admin-contest-setup-form__field">
                <label htmlFor="custom-contestant-label-plural">Plural</label>
                <input
                  id="custom-contestant-label-plural"
                  type="text"
                  className="admin-rounds-input"
                  value={contestantLabelPlural}
                  onChange={(event) => onContestantLabelPluralChange(event.target.value)}
                  placeholder="Contestants"
                  disabled={disabled}
                />
              </div>
            </div>

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
        )}
      </div>
    </section>
  );
}

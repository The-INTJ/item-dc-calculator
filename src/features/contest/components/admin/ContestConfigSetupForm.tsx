'use client';

/**
 * ContestConfigSetupForm - Config section for creating a new contest.
 * Supports template selection or custom configuration.
 * Styled to align with ContestConfigEditor.
 */

import React from 'react';
import { AttributeEditor } from './AttributeEditor';
import type { AttributeConfig, ContestConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';

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
  saveAsTemplate,
  onSaveAsTemplateChange,
  disabled = false,
}: ContestConfigSetupFormProps) {
  const selectedConfig: ContestConfig | undefined = configs.find((c) => c.id === selectedTemplate);

  return (
    <section className="admin-details-section">
      <div className="admin-contest-setup-form">
        <div className="admin-contest-setup-form__field">
          <label>Configuration Mode</label>
          <div className="admin-contest-setup-form__mode-toggle">
            <button
              type="button"
              className={`button-secondary ${configMode === 'template' ? 'button-secondary--active' : ''}`}
              onClick={() => onConfigModeChange('template')}
              disabled={disabled}
            >
              Use Template
            </button>
            <button
              type="button"
              className={`button-secondary ${configMode === 'custom' ? 'button-secondary--active' : ''}`}
              onClick={() => onConfigModeChange('custom')}
              disabled={disabled}
            >
              Custom Config
            </button>
          </div>
        </div>

        {configMode === 'template' && (
          <>
            <div className="admin-contest-setup-form__field">
              <label htmlFor="contest-template">Contest Template</label>
              <select
                id="contest-template"
                className="admin-rounds-select"
                value={selectedTemplate}
                onChange={(e) => onSelectedTemplateChange(e.target.value)}
                disabled={configsLoading || disabled}
              >
                {configs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.topic}
                  </option>
                ))}
              </select>
              {configsLoading && <span className="admin-detail-meta">Loading configs...</span>}
              {configsError && <p className="admin-phase-controls__message--error">{configsError}</p>}
            </div>

            <div className="admin-contest-setup-form__row">
              <div className="admin-contest-setup-form__field">
                <label htmlFor="contest-entry-label">Entry Label</label>
                <input
                  id="contest-entry-label"
                  type="text"
                  className="admin-rounds-input"
                  value={entryLabel}
                  onChange={(e) => onEntryLabelChange(e.target.value)}
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
                  onChange={(e) => onEntryLabelPluralChange(e.target.value)}
                  placeholder={selectedConfig?.entryLabelPlural ?? 'Entries'}
                  disabled={disabled}
                />
              </div>
            </div>

            {selectedConfig && <ConfigPreview config={selectedConfig} />}
          </>
        )}

        {configMode === 'custom' && (
          <>
            <div className="admin-contest-setup-form__field">
              <label htmlFor="contest-topic">Topic / Contest Type</label>
              <input
                id="contest-topic"
                type="text"
                className="admin-rounds-input"
                value={customTopic}
                onChange={(e) => onCustomTopicChange(e.target.value)}
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
                  onChange={(e) => onEntryLabelChange(e.target.value)}
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
                  onChange={(e) => onEntryLabelPluralChange(e.target.value)}
                  placeholder="Entries"
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
                  onChange={(e) => onSaveAsTemplateChange(e.target.checked)}
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

interface ConfigPreviewProps {
  config: ContestConfig;
}

function ConfigPreview({ config }: ConfigPreviewProps) {
  return (
    <div className="admin-contest-setup-form__preview">
      <p>
        <strong>Topic:</strong> {config.topic}
      </p>
      <p>
        <strong>Entry type:</strong> {config.entryLabel ?? 'Entry'} / {config.entryLabelPlural ?? 'Entries'}
      </p>
      <h4>Scoring Attributes ({config.attributes.length})</h4>
      <ul className="admin-detail-list">
        {config.attributes.map((attr) => (
          <li key={attr.id} className="admin-detail-item">
            <strong>{attr.label}</strong>
            <span className="admin-detail-meta"> ({attr.id})</span>
            {attr.description && (
              <span className="admin-detail-meta"> - {attr.description}</span>
            )}
            <span className="admin-detail-meta">
              {' '}Range: {attr.min ?? 0}-{attr.max ?? 10}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

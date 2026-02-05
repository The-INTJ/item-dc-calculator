'use client';

/**
 * ContestConfigEditor - Edit scoring configuration for an existing contest.
 * Shows current config and allows editing when no scores exist.
 */

import { useState, useCallback } from 'react';
import type { Contest, ContestConfig, AttributeConfig } from '../../lib/globals';
import { getEffectiveConfig } from '../../lib/globals/validation';
import { AttributeEditor } from './AttributeEditor';

interface ContestConfigEditorProps {
  contest: Contest;
  onSave: (config: ContestConfig) => Promise<void>;
}

export function ContestConfigEditor({ contest, onSave }: ContestConfigEditorProps) {
  const effectiveConfig = getEffectiveConfig(contest);
  const hasScores = contest.scores.length > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [topic, setTopic] = useState(effectiveConfig.topic);
  const [entryLabel, setEntryLabel] = useState(effectiveConfig.entryLabel ?? '');
  const [entryLabelPlural, setEntryLabelPlural] = useState(effectiveConfig.entryLabelPlural ?? '');
  const [attributes, setAttributes] = useState<AttributeConfig[]>(effectiveConfig.attributes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = useCallback(() => {
    setTopic(effectiveConfig.topic);
    setEntryLabel(effectiveConfig.entryLabel ?? '');
    setEntryLabelPlural(effectiveConfig.entryLabelPlural ?? '');
    setAttributes(effectiveConfig.attributes);
    setIsEditing(false);
    setError(null);
  }, [effectiveConfig]);

  const handleSave = async () => {
    if (!topic.trim()) {
      setError('Topic is required.');
      return;
    }
    if (attributes.length === 0) {
      setError('At least one scoring attribute is required.');
      return;
    }
    const invalidAttr = attributes.find((a) => !a.id.trim() || !a.label.trim());
    if (invalidAttr) {
      setError('All attributes must have an ID and label.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        topic: topic.trim(),
        attributes,
        entryLabel: entryLabel.trim() || undefined,
        entryLabelPlural: entryLabelPlural.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <section className="admin-details-section">
        <div className="admin-rounds-header">
          <h3>Contest Configuration</h3>
          {!hasScores && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit Config
            </button>
          )}
        </div>
        <ConfigSummary config={effectiveConfig} hasScores={hasScores} />
      </section>
    );
  }

  return (
    <section className="admin-details-section">
      <h3>Edit Configuration</h3>
      {hasScores && (
        <p className="admin-phase-controls__message--error">
          Cannot edit configuration after scores have been submitted.
        </p>
      )}
      <div className="admin-contest-setup-form">
        <div className="admin-contest-setup-form__field">
          <label htmlFor="edit-topic">Topic</label>
          <input
            id="edit-topic"
            type="text"
            className="admin-rounds-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="admin-contest-setup-form__row">
          <div className="admin-contest-setup-form__field">
            <label htmlFor="edit-entry-label">Entry Label</label>
            <input
              id="edit-entry-label"
              type="text"
              className="admin-rounds-input"
              value={entryLabel}
              onChange={(e) => setEntryLabel(e.target.value)}
              placeholder="Entry"
              disabled={isSaving}
            />
          </div>
          <div className="admin-contest-setup-form__field">
            <label htmlFor="edit-entry-label-plural">Plural</label>
            <input
              id="edit-entry-label-plural"
              type="text"
              className="admin-rounds-input"
              value={entryLabelPlural}
              onChange={(e) => setEntryLabelPlural(e.target.value)}
              placeholder="Entries"
              disabled={isSaving}
            />
          </div>
        </div>
        <div className="admin-contest-setup-form__field">
          <label>Scoring Attributes</label>
          <AttributeEditor
            attributes={attributes}
            onChange={setAttributes}
            disabled={isSaving}
          />
        </div>
        {error && <p className="admin-phase-controls__message--error">{error}</p>}
        <div className="admin-contest-setup-form__actions">
          <button
            type="button"
            className="button-secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </div>
    </section>
  );
}

interface ConfigSummaryProps {
  config: ContestConfig;
  hasScores: boolean;
}

function ConfigSummary({ config, hasScores }: ConfigSummaryProps) {
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
            <span className="admin-detail-meta">({attr.id})</span>
            {attr.description && (
              <span className="admin-detail-meta"> — {attr.description}</span>
            )}
            <span className="admin-detail-meta">
              Range: {attr.min ?? 0}–{attr.max ?? 10}
            </span>
          </li>
        ))}
      </ul>
      {hasScores && (
        <p className="admin-detail-meta">
          Configuration is locked because scores have been submitted.
        </p>
      )}
    </div>
  );
}

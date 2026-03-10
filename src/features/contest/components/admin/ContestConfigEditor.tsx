'use client';

/**
 * ContestConfigEditor - Edit scoring configuration for an existing contest.
 * Shows current config and allows editing when no scores exist.
 */

import { useCallback, useState } from 'react';
import type { AttributeConfig, Contest, ContestConfig } from '../../contexts/contest/contestTypes';
import {
  buildContestConfigFromDraft,
  createContestConfigDraft,
  validateContestConfigDraft,
} from '../../lib/domain/contestConfigDraft';
import { getEffectiveConfig } from '../../lib/domain/validation';
import { AttributeEditor } from './AttributeEditor';
import { ContestConfigPreview } from './ContestConfigPreview';

interface ContestConfigEditorProps {
  contest: Contest;
  onSave: (config: ContestConfig) => Promise<void>;
}

export function ContestConfigEditor({ contest, onSave }: ContestConfigEditorProps) {
  const effectiveConfig = getEffectiveConfig(contest);
  const hasScores = contest.entries.some((entry) => (entry.voteCount ?? 0) > 0);
  const defaultDraft = createContestConfigDraft(effectiveConfig);

  const [isEditing, setIsEditing] = useState(false);
  const [topic, setTopic] = useState(defaultDraft.topic);
  const [entryLabel, setEntryLabel] = useState(defaultDraft.entryLabel);
  const [entryLabelPlural, setEntryLabelPlural] = useState(defaultDraft.entryLabelPlural);
  const [attributes, setAttributes] = useState<AttributeConfig[]>(defaultDraft.attributes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = useCallback(() => {
    const resetDraft = createContestConfigDraft(effectiveConfig);
    setTopic(resetDraft.topic);
    setEntryLabel(resetDraft.entryLabel);
    setEntryLabelPlural(resetDraft.entryLabelPlural);
    setAttributes(resetDraft.attributes);
    setIsEditing(false);
    setError(null);
  }, [effectiveConfig]);

  const handleSave = async () => {
    const validationError = validateContestConfigDraft({ topic, attributes });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(
        buildContestConfigFromDraft({
          topic,
          entryLabel,
          entryLabelPlural,
          attributes,
        }),
      );
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save config.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <section className="admin-details-section">
        <div className="admin-rounds-header">
          <h3>Contest Configuration</h3>
          {!hasScores ? (
            <button
              type="button"
              className="button-secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit Config
            </button>
          ) : null}
        </div>
        <ContestConfigPreview
          config={effectiveConfig}
          footerMessage={
            hasScores
              ? 'Configuration is locked because scores have been submitted.'
              : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className="admin-details-section">
      <h3>Edit Configuration</h3>
      {hasScores ? (
        <p className="admin-phase-controls__message--error">
          Cannot edit configuration after scores have been submitted.
        </p>
      ) : null}
      <div className="admin-contest-setup-form">
        <div className="admin-contest-setup-form__field">
          <label htmlFor="edit-topic">Topic</label>
          <input
            id="edit-topic"
            type="text"
            className="admin-rounds-input"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
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
              onChange={(event) => setEntryLabel(event.target.value)}
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
              onChange={(event) => setEntryLabelPlural(event.target.value)}
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
        {error ? <p className="admin-phase-controls__message--error">{error}</p> : null}
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

'use client';

/**
 * ContestConfigEditor - Edit scoring configuration for an existing contest.
 * Shows current config and allows editing when no scores exist.
 */

import { useState } from 'react';
import type { Contest, ContestConfig } from '../../contexts/contest/contestTypes';
import { getEffectiveConfig } from '../../lib/domain/validation';
import { ContestConfigPreview } from './ContestConfigPreview';
import { ContestConfigEditForm } from './ContestConfigEditForm';
import { useConfigEditDraft } from './useConfigEditDraft';

interface ContestConfigEditorProps {
  contest: Contest;
  onSave: (config: ContestConfig) => Promise<void>;
}

export function ContestConfigEditor({ contest, onSave }: ContestConfigEditorProps) {
  const effectiveConfig = getEffectiveConfig(contest);
  const hasScores = false;

  const [isEditing, setIsEditing] = useState(false);
  const { draft, setField, setAttributes, isSaving, error, reset, save } = useConfigEditDraft(
    effectiveConfig,
    onSave,
  );

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (await save()) setIsEditing(false);
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
    <ContestConfigEditForm
      draft={draft}
      setField={setField}
      setAttributes={setAttributes}
      isSaving={isSaving}
      error={error}
      hasScores={hasScores}
      onCancel={handleCancel}
      onSave={() => void handleSave()}
    />
  );
}

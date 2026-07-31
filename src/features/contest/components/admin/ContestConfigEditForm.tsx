'use client';

import type { AttributeConfig } from '../../contexts/contest/contestTypes';
import type { ContestConfigDraft } from '../../lib/domain/contestConfigDraft';
import { AttributeEditor } from './AttributeEditor';
import { ContestLabelFields } from './ContestLabelFields';
import type { ConfigTextField } from './useConfigEditDraft';

interface ContestConfigEditFormProps {
  draft: ContestConfigDraft;
  setField: (name: ConfigTextField, value: string) => void;
  setAttributes: (attributes: AttributeConfig[]) => void;
  isSaving: boolean;
  error: string | null;
  hasScores: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/** The editable form. Scoring vocabulary first, then the attributes voters score. */
export function ContestConfigEditForm({
  draft,
  setField,
  setAttributes,
  isSaving,
  error,
  hasScores,
  onCancel,
  onSave,
}: ContestConfigEditFormProps) {
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
            value={draft.topic}
            onChange={(event) => setField('topic', event.target.value)}
            disabled={isSaving}
          />
        </div>

        <ContestLabelFields
          idPrefix="edit"
          entryLabel={draft.entryLabel}
          onEntryLabelChange={(value) => setField('entryLabel', value)}
          entryLabelPlural={draft.entryLabelPlural}
          onEntryLabelPluralChange={(value) => setField('entryLabelPlural', value)}
          contestantLabel={draft.contestantLabel}
          onContestantLabelChange={(value) => setField('contestantLabel', value)}
          contestantLabelPlural={draft.contestantLabelPlural}
          onContestantLabelPluralChange={(value) => setField('contestantLabelPlural', value)}
          entryPlaceholder="Entry"
          entryPluralPlaceholder="Entries"
          contestantPlaceholder="Contestant"
          contestantPluralPlaceholder="Contestants"
          disabled={isSaving}
        />

        <div className="admin-contest-setup-form__field">
          <label>Scoring Attributes</label>
          <AttributeEditor
            attributes={draft.attributes}
            onChange={setAttributes}
            disabled={isSaving}
          />
        </div>
        {error ? <p className="admin-phase-controls__message--error">{error}</p> : null}
        <div className="admin-contest-setup-form__actions">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="button-primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </div>
    </section>
  );
}

'use client';

/**
 * ContestSetupForm - Form for creating a new contest with template selection.
 * MVP: name, slug (auto-generated), and template dropdown.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContestConfigSetupForm } from './ContestConfigSetupForm';
import { ContestIdentityFields, useContestIdentity } from './ContestIdentityFields';
import { useContestConfigDraft } from './useContestConfigDraft';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { contestApi } from '../../lib/api/contestApi';

interface ContestSetupFormProps {
  onSuccess?: () => void;
}

/**
 * Build the config from the draft, persist it as a template when asked, then create the contest.
 */
async function createContestFromDraft(
  name: string,
  slug: string,
  draft: ReturnType<typeof useContestConfigDraft>,
) {
  const config = draft.buildConfig();

  if (!config) {
    throw new Error('Select a template before creating a contest.');
  }

  await draft.saveTemplateIfRequested(config);

  const createResult = await contestApi.createContest({
    name: name.trim(),
    slug: slug.trim(),
    config,
  });

  if (!createResult.success || !createResult.data) {
    throw new Error(createResult.error ?? 'Failed to create contest');
  }

  return createResult.data;
}

export function ContestSetupForm({ onSuccess }: ContestSetupFormProps) {
  const router = useRouter();
  const { upsertContest } = useContestStore();
  const identity = useContestIdentity();
  const draft = useContestConfigDraft();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identity.name.trim() || !identity.slug.trim()) {
      setError('Name and slug are required.');
      return;
    }

    const validationError = draft.validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createContestFromDraft(identity.name, identity.slug, draft);
      upsertContest(created);
      onSuccess?.();
      router.push('/admin');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create contest.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="admin-contest-setup-form" onSubmit={handleSubmit}>
      <ContestIdentityFields identity={identity} />

      <ContestConfigSetupForm
        configMode={draft.configMode}
        onConfigModeChange={draft.setConfigMode}
        configs={draft.configs}
        configsLoading={draft.configsLoading}
        configsError={draft.configsError}
        selectedTemplate={draft.selectedTemplate}
        onSelectedTemplateChange={draft.setSelectedTemplate}
        customTopic={draft.customTopic}
        onCustomTopicChange={draft.setCustomTopic}
        customAttributes={draft.customAttributes}
        onCustomAttributesChange={draft.setCustomAttributes}
        entryLabel={draft.entryLabel}
        onEntryLabelChange={draft.setEntryLabel}
        entryLabelPlural={draft.entryLabelPlural}
        onEntryLabelPluralChange={draft.setEntryLabelPlural}
        contestantLabel={draft.contestantLabel}
        onContestantLabelChange={draft.setContestantLabel}
        contestantLabelPlural={draft.contestantLabelPlural}
        onContestantLabelPluralChange={draft.setContestantLabelPlural}
        saveAsTemplate={draft.saveAsTemplate}
        onSaveAsTemplateChange={draft.setSaveAsTemplate}
        disabled={isSubmitting}
      />

      {error ? <p className="admin-phase-controls__message--error">{error}</p> : null}

      <div className="admin-contest-setup-form__actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => router.push('/admin')}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Contest'}
        </button>
      </div>
    </form>
  );
}

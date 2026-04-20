'use client';

/**
 * ContestSetupForm - Form for creating a new contest with template selection.
 * MVP: name, slug (auto-generated), and template dropdown.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContestConfigSetupForm } from './ContestConfigSetupForm';
import type { AttributeConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { contestApi } from '../../lib/api/contestApi';
import {
  buildContestConfigFromDraft,
  buildContestConfigFromTemplate,
  validateContestConfigDraft,
} from '../../lib/domain/contestConfigDraft';

type ConfigMode = 'template' | 'custom';

interface ContestSetupFormProps {
  onSuccess?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function ContestSetupForm({ onSuccess }: ContestSetupFormProps) {
  const router = useRouter();
  const { upsertContest } = useContestStore();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>('template');
  const [configs, setConfigs] = useState<ContestConfigItem[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [configsError, setConfigsError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customAttributes, setCustomAttributes] = useState<AttributeConfig[]>([
    { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
  ]);
  const [entryLabel, setEntryLabel] = useState('');
  const [entryLabelPlural, setEntryLabelPlural] = useState('');
  const [contestantLabel, setContestantLabel] = useState('');
  const [contestantLabelPlural, setContestantLabelPlural] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextName = event.target.value;
      setName(nextName);
      if (!slugManuallyEdited) {
        setSlug(slugify(nextName));
      }
    },
    [slugManuallyEdited],
  );

  const handleSlugChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(event.target.value));
    setSlugManuallyEdited(true);
  }, []);

  useEffect(() => {
    async function fetchConfigs() {
      const result = await contestApi.listConfigs();
      if (!result.success) {
        setConfigsError(result.error ?? 'Failed to load configs');
        setConfigsLoading(false);
        return;
      }

      const nextConfigs = result.data ?? [];
      setConfigs(nextConfigs);
      if (nextConfigs.length > 0) {
        setSelectedTemplate(nextConfigs[0].id);
      }
      setConfigsLoading(false);
    }

    void fetchConfigs();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }

    if (configMode === 'custom') {
      const validationError = validateContestConfigDraft({
        topic: customTopic,
        attributes: customAttributes,
      });
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedConfig = configs.find((config) => config.id === selectedTemplate);

      const config =
        configMode === 'template'
          ? selectedConfig
            ? buildContestConfigFromTemplate(selectedConfig, {
                entryLabel,
                entryLabelPlural,
                contestantLabel,
                contestantLabelPlural,
              })
            : null
          : buildContestConfigFromDraft({
              topic: customTopic,
              entryLabel,
              entryLabelPlural,
              contestantLabel,
              contestantLabelPlural,
              attributes: customAttributes,
            });

      if (!config) {
        throw new Error('Select a template before creating a contest.');
      }

      if (configMode === 'custom' && saveAsTemplate) {
        const configResult = await contestApi.createConfig({
          topic: config.topic,
          attributes: config.attributes,
          entryLabel: config.entryLabel,
          entryLabelPlural: config.entryLabelPlural,
        });

        if (!configResult.success) {
          throw new Error(configResult.error ?? 'Failed to save config as template');
        }
      }

      const createResult = await contestApi.createContest({
        name: name.trim(),
        slug: slug.trim(),
        config,
      });

      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error ?? 'Failed to create contest');
      }

      upsertContest(createResult.data);
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
      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-name">Contest Name</label>
        <input
          id="contest-name"
          type="text"
          className="admin-rounds-input"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Summer Dessert Showdown"
          required
        />
      </div>

      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-slug">URL Slug</label>
        <input
          id="contest-slug"
          type="text"
          className="admin-rounds-input"
          value={slug}
          onChange={handleSlugChange}
          placeholder="e.g. summer-contest-2026"
          required
        />
        <span className="admin-detail-meta">Auto-generated from name. Edit to customize.</span>
      </div>

      <ContestConfigSetupForm
        configMode={configMode}
        onConfigModeChange={setConfigMode}
        configs={configs}
        configsLoading={configsLoading}
        configsError={configsError}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        customTopic={customTopic}
        onCustomTopicChange={setCustomTopic}
        customAttributes={customAttributes}
        onCustomAttributesChange={setCustomAttributes}
        entryLabel={entryLabel}
        onEntryLabelChange={setEntryLabel}
        entryLabelPlural={entryLabelPlural}
        onEntryLabelPluralChange={setEntryLabelPlural}
        contestantLabel={contestantLabel}
        onContestantLabelChange={setContestantLabel}
        contestantLabelPlural={contestantLabelPlural}
        onContestantLabelPluralChange={setContestantLabelPlural}
        saveAsTemplate={saveAsTemplate}
        onSaveAsTemplateChange={setSaveAsTemplate}
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

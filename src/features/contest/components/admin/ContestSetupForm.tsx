'use client';

/**
 * ContestSetupForm - Form for creating a new contest with template selection.
 * MVP: name, slug (auto-generated), and template dropdown.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContestConfigSetupForm } from './ContestConfigSetupForm';
import type { AttributeConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { adminApi } from '../../lib/api/adminApi';

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
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!slugManuallyEdited) {
        setSlug(slugify(newName));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value));
    setSlugManuallyEdited(true);
  }, []);

  useEffect(() => {
    async function fetchConfigs() {
      const result = await adminApi.listConfigs();
      if (!result.success) {
        setConfigsError(result.error ?? 'Failed to load configs');
        setConfigsLoading(false);
        return;
      }

      const data = result.data ?? [];
      setConfigs(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id);
      }
      setConfigsLoading(false);
    }

    void fetchConfigs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required.');
      return;
    }

    if (configMode === 'custom') {
      if (!customTopic.trim()) {
        setError('Topic is required for custom configuration.');
        return;
      }
      if (customAttributes.length === 0) {
        setError('At least one scoring attribute is required.');
        return;
      }
      const invalidAttr = customAttributes.find((a) => !a.id.trim() || !a.label.trim());
      if (invalidAttr) {
        setError('All attributes must have an ID and label.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedConfig = configs.find((c) => c.id === selectedTemplate);

      let config;
      if (configMode === 'template' && selectedConfig) {
        config = {
          topic: selectedConfig.topic,
          attributes: selectedConfig.attributes,
          entryLabel: entryLabel.trim() || selectedConfig.entryLabel,
          entryLabelPlural: entryLabelPlural.trim() || selectedConfig.entryLabelPlural,
        };
      } else {
        config = {
          topic: customTopic.trim(),
          attributes: customAttributes,
          entryLabel: entryLabel.trim() || undefined,
          entryLabelPlural: entryLabelPlural.trim() || undefined,
        };
      }

      if (configMode === 'custom' && saveAsTemplate) {
        const configResult = await adminApi.createConfig({
          topic: config.topic,
          attributes: config.attributes,
          entryLabel: config.entryLabel,
          entryLabelPlural: config.entryLabelPlural,
        });

        if (!configResult.success) {
          throw new Error(configResult.error ?? 'Failed to save config as template');
        }
      }

      const createResult = await adminApi.createContest({
        name: name.trim(),
        slug: slug.trim(),
        phase: 'set',
        config,
      });

      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error ?? 'Failed to create contest');
      }

      upsertContest(createResult.data);
      onSuccess?.();
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contest.');
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
          placeholder="e.g. Summer Mixology Championship"
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
        saveAsTemplate={saveAsTemplate}
        onSaveAsTemplateChange={setSaveAsTemplate}
        disabled={isSubmitting}
      />

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

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

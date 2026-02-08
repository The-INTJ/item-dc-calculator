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

  // Fetch configs from API on mount
  useEffect(() => {
    async function fetchConfigs() {
      try {
        const response = await fetch('/api/contest/configs');
        if (!response.ok) {
          throw new Error('Failed to load configs');
        }
        const data = await response.json();
        setConfigs(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0].id); // Select first config by default
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load configs';
        setConfigsError(message);
      } finally {
        setConfigsLoading(false);
      }
    }

    fetchConfigs();
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
      // Build config from template or custom values
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

      // If custom mode and saveAsTemplate is checked, create the config first
      if (configMode === 'custom' && saveAsTemplate) {
        const configPayload = {
          topic: config.topic,
          attributes: config.attributes,
          entryLabel: config.entryLabel,
          entryLabelPlural: config.entryLabelPlural,
        };

        const configResponse = await fetch('/api/contest/configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-contest-role': 'admin',
          },
          body: JSON.stringify(configPayload),
        });

        if (!configResponse.ok) {
          const data = await configResponse.json().catch(() => ({}));
          throw new Error(data.error ?? `Failed to save config as template (${configResponse.status})`);
        }
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        config,
      };

      const response = await fetch('/api/contest/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-contest-role': 'admin',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to create contest (${response.status})`);
      }

      const createdContest = await response.json();
      upsertContest(createdContest);
      onSuccess?.();
      router.push('/contest/admin');
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
          onClick={() => router.push('/contest/admin')}
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

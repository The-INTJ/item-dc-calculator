'use client';

/**
 * ContestSetupForm - Form for creating a new contest with template selection.
 * MVP: name, slug (auto-generated), and template dropdown.
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplateKeys, DEFAULT_TEMPLATES } from '../../types/templates';
import { AttributeEditor } from './AttributeEditor';
import type { AttributeConfig, ContestConfig } from '../../types';
import { useAdminContestData } from '../../contexts/AdminContestContext';

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
  const { upsertContest } = useAdminContestData();
  const templateKeys = getTemplateKeys();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [configMode, setConfigMode] = useState<ConfigMode>('template');
  const [selectedTemplate, setSelectedTemplate] = useState(templateKeys[0] ?? 'mixology');
  const [customTopic, setCustomTopic] = useState('');
  const [customAttributes, setCustomAttributes] = useState<AttributeConfig[]>([
    { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
  ]);
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [entryLabel, setEntryLabel] = useState('');
  const [entryLabelPlural, setEntryLabelPlural] = useState('');
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
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
      };

      if (configMode === 'template') {
        payload.configTemplate = selectedTemplate;
      } else {
        payload.config = {
          topic: customTopic.trim(),
          attributes: customAttributes,
          entryLabel: entryLabel.trim() || undefined,
          entryLabelPlural: entryLabelPlural.trim() || undefined,
        };
      }

      if (location.trim()) payload.location = location.trim();
      if (startTime) payload.startTime = new Date(startTime).toISOString();
      if (configMode === 'template' && (entryLabel.trim() || entryLabelPlural.trim())) {
        payload.entryLabel = entryLabel.trim() || undefined;
        payload.entryLabelPlural = entryLabelPlural.trim() || undefined;
      }

      const response = await fetch('/api/mixology/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mixology-role': 'admin',
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
      router.push('/mixology/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contest.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConfig: ContestConfig | undefined = DEFAULT_TEMPLATES[selectedTemplate];

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
          placeholder="e.g. summer-mixology-2026"
          required
        />
        <span className="admin-detail-meta">Auto-generated from name. Edit to customize.</span>
      </div>

      <div className="admin-contest-setup-form__field">
        <label>Configuration Mode</label>
        <div className="admin-contest-setup-form__mode-toggle">
          <button
            type="button"
            className={`button-secondary ${configMode === 'template' ? 'button-secondary--active' : ''}`}
            onClick={() => setConfigMode('template')}
          >
            Use Template
          </button>
          <button
            type="button"
            className={`button-secondary ${configMode === 'custom' ? 'button-secondary--active' : ''}`}
            onClick={() => setConfigMode('custom')}
          >
            Custom Config
          </button>
        </div>
      </div>

      {configMode === 'template' && (
        <div className="admin-contest-setup-form__field">
          <label htmlFor="contest-template">Contest Template</label>
          <select
            id="contest-template"
            className="admin-rounds-select"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            {templateKeys.map((key) => (
              <option key={key} value={key}>
                {DEFAULT_TEMPLATES[key]?.topic ?? key}
              </option>
            ))}
          </select>
        </div>
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
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Chili Cook-Off, Dance Battle"
              required
            />
          </div>
          <div className="admin-contest-setup-form__field">
            <label>Scoring Attributes</label>
            <AttributeEditor
              attributes={customAttributes}
              onChange={setCustomAttributes}
              disabled={isSubmitting}
            />
          </div>
        </>
      )}

      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-location">Location (optional)</label>
        <input
          id="contest-location"
          type="text"
          className="admin-rounds-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Downtown Convention Center"
        />
      </div>

      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-start-time">Start Time (optional)</label>
        <input
          id="contest-start-time"
          type="datetime-local"
          className="admin-rounds-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      <div className="admin-contest-setup-form__row">
        <div className="admin-contest-setup-form__field">
          <label htmlFor="contest-entry-label">Entry Label (optional)</label>
          <input
            id="contest-entry-label"
            type="text"
            className="admin-rounds-input"
            value={entryLabel}
            onChange={(e) => setEntryLabel(e.target.value)}
            placeholder={selectedConfig?.entryLabel ?? 'Entry'}
          />
        </div>
        <div className="admin-contest-setup-form__field">
          <label htmlFor="contest-entry-label-plural">Plural (optional)</label>
          <input
            id="contest-entry-label-plural"
            type="text"
            className="admin-rounds-input"
            value={entryLabelPlural}
            onChange={(e) => setEntryLabelPlural(e.target.value)}
            placeholder={selectedConfig?.entryLabelPlural ?? 'Entries'}
          />
        </div>
      </div>

      {configMode === 'template' && selectedConfig && (
        <div className="admin-contest-setup-form__preview">
          <h4>Scoring Attributes</h4>
          <ul className="admin-detail-list">
            {selectedConfig.attributes.map((attr) => (
              <li key={attr.id} className="admin-detail-item">
                <strong>{attr.label}</strong>
                {attr.description && (
                  <span className="admin-detail-meta"> — {attr.description}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="admin-detail-meta">
            Entry type: {selectedConfig.entryLabel ?? 'Entry'}
          </p>
        </div>
      )}

      {error && <p className="admin-phase-controls__message--error">{error}</p>}

      <div className="admin-contest-setup-form__actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => router.push('/mixology/admin')}
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

'use client';

import { useEffect, useState } from 'react';
import type {
  AttributeConfig,
  ContestConfig,
  ContestConfigItem,
} from '../../contexts/contest/contestTypes';
import { contestApi } from '../../lib/api/contestApi';
import {
  buildContestConfigFromDraft,
  buildContestConfigFromTemplate,
  validateContestConfigDraft,
} from '../../lib/domain/contestConfigDraft';

type ConfigMode = 'template' | 'custom';

interface ConfigDraftState {
  configMode: ConfigMode;
  configs: ContestConfigItem[];
  selectedTemplate: string;
  customTopic: string;
  customAttributes: AttributeConfig[];
  entryLabel: string;
  entryLabelPlural: string;
  contestantLabel: string;
  contestantLabelPlural: string;
}

/**
 * Resolve the draft into a full config: the chosen template (with label overrides) or the custom draft.
 */
function buildConfigFromDraftState(state: ConfigDraftState) {
  const selectedConfig = state.configs.find((config) => config.id === state.selectedTemplate);

  return state.configMode === 'template'
    ? selectedConfig
      ? buildContestConfigFromTemplate(selectedConfig, {
          entryLabel: state.entryLabel,
          entryLabelPlural: state.entryLabelPlural,
          contestantLabel: state.contestantLabel,
          contestantLabelPlural: state.contestantLabelPlural,
        })
      : null
    : buildContestConfigFromDraft({
        topic: state.customTopic,
        entryLabel: state.entryLabel,
        entryLabelPlural: state.entryLabelPlural,
        contestantLabel: state.contestantLabel,
        contestantLabelPlural: state.contestantLabelPlural,
        attributes: state.customAttributes,
      });
}

/**
 * The fetched config-template list: loads on mount and auto-selects the first
 * template once it arrives.
 */
function useConfigTemplates() {
  const [configs, setConfigs] = useState<ContestConfigItem[]>([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [configsError, setConfigsError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

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

  return { configs, configsLoading, configsError, selectedTemplate, setSelectedTemplate };
}

/**
 * Owns the config half of contest creation: template-vs-custom mode, the
 * fetched template list, label overrides, and the custom attribute draft.
 */
export function useContestConfigDraft() {
  const [configMode, setConfigMode] = useState<ConfigMode>('template');
  const { configs, configsLoading, configsError, selectedTemplate, setSelectedTemplate } =
    useConfigTemplates();
  const [customTopic, setCustomTopic] = useState('');
  const [customAttributes, setCustomAttributes] = useState<AttributeConfig[]>([
    { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
  ]);
  const [entryLabel, setEntryLabel] = useState('');
  const [entryLabelPlural, setEntryLabelPlural] = useState('');
  const [contestantLabel, setContestantLabel] = useState('');
  const [contestantLabelPlural, setContestantLabelPlural] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const validateDraft = () =>
    configMode === 'custom'
      ? validateContestConfigDraft({ topic: customTopic, attributes: customAttributes })
      : null;

  const buildConfig = () =>
    buildConfigFromDraftState({
      configMode,
      configs,
      selectedTemplate,
      customTopic,
      customAttributes,
      entryLabel,
      entryLabelPlural,
      contestantLabel,
      contestantLabelPlural,
    });

  const saveTemplateIfRequested = async (config: ContestConfig) => {
    if (configMode !== 'custom' || !saveAsTemplate) return;
    const configResult = await contestApi.createConfig({
      topic: config.topic,
      attributes: config.attributes,
      entryLabel: config.entryLabel,
      entryLabelPlural: config.entryLabelPlural,
    });

    if (!configResult.success) {
      throw new Error(configResult.error ?? 'Failed to save config as template');
    }
  };

  return {
    configMode,
    setConfigMode,
    configs,
    configsLoading,
    configsError,
    selectedTemplate,
    setSelectedTemplate,
    customTopic,
    setCustomTopic,
    customAttributes,
    setCustomAttributes,
    entryLabel,
    setEntryLabel,
    entryLabelPlural,
    setEntryLabelPlural,
    contestantLabel,
    setContestantLabel,
    contestantLabelPlural,
    setContestantLabelPlural,
    saveAsTemplate,
    setSaveAsTemplate,
    validateDraft,
    buildConfig,
    saveTemplateIfRequested,
  };
}

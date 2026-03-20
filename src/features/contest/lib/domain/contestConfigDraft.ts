import type {
  AttributeConfig,
  ContestConfig,
  ContestConfigItem,
} from '../../contexts/contest/contestTypes';

export interface ContestConfigDraft {
  topic: string;
  entryLabel: string;
  entryLabelPlural: string;
  contestantLabel: string;
  contestantLabelPlural: string;
  attributes: AttributeConfig[];
}

function cloneAttribute(attribute: AttributeConfig): AttributeConfig {
  return {
    ...attribute,
    description: attribute.description ?? '',
    min: attribute.min ?? 0,
    max: attribute.max ?? 10,
  };
}

export function cloneAttributes(attributes: AttributeConfig[]): AttributeConfig[] {
  return attributes.map((attribute) => cloneAttribute(attribute));
}

export function generateAttributeId(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^[^a-z]/, 'attr_');
}

export function createEmptyAttribute(): AttributeConfig {
  return { id: '', label: '', description: '', min: 0, max: 10 };
}

export function createContestConfigDraft(config?: ContestConfig | null): ContestConfigDraft {
  return {
    topic: config?.topic ?? '',
    entryLabel: config?.entryLabel ?? '',
    entryLabelPlural: config?.entryLabelPlural ?? '',
    contestantLabel: config?.contestantLabel ?? '',
    contestantLabelPlural: config?.contestantLabelPlural ?? '',
    attributes: cloneAttributes(config?.attributes ?? []),
  };
}

function normalizeAttribute(attribute: AttributeConfig): AttributeConfig {
  return {
    ...attribute,
    id: attribute.id.trim(),
    label: attribute.label.trim(),
    description: attribute.description?.trim() || undefined,
    min: attribute.min ?? 0,
    max: attribute.max ?? 10,
  };
}

export function buildContestConfigFromDraft(draft: ContestConfigDraft): ContestConfig {
  return {
    topic: draft.topic.trim(),
    entryLabel: draft.entryLabel.trim() || undefined,
    entryLabelPlural: draft.entryLabelPlural.trim() || undefined,
    contestantLabel: draft.contestantLabel.trim() || undefined,
    contestantLabelPlural: draft.contestantLabelPlural.trim() || undefined,
    attributes: draft.attributes.map((attribute) => normalizeAttribute(attribute)),
  };
}

export function buildContestConfigFromTemplate(
  template: ContestConfigItem,
  overrides: Pick<ContestConfigDraft, 'entryLabel' | 'entryLabelPlural' | 'contestantLabel' | 'contestantLabelPlural'>,
): ContestConfig {
  return {
    topic: template.topic,
    entryLabel: overrides.entryLabel.trim() || template.entryLabel,
    entryLabelPlural: overrides.entryLabelPlural.trim() || template.entryLabelPlural,
    contestantLabel: overrides.contestantLabel.trim() || template.contestantLabel,
    contestantLabelPlural: overrides.contestantLabelPlural.trim() || template.contestantLabelPlural,
    attributes: cloneAttributes(template.attributes),
  };
}

export function validateContestConfigDraft(
  draft: Pick<ContestConfigDraft, 'topic' | 'attributes'>,
  options: { requireTopic?: boolean } = {},
): string | null {
  const { requireTopic = true } = options;

  if (requireTopic && !draft.topic.trim()) {
    return 'Topic is required.';
  }

  if (draft.attributes.length === 0) {
    return 'At least one scoring attribute is required.';
  }

  const invalidAttribute = draft.attributes.find(
    (attribute) => !attribute.id.trim() || !attribute.label.trim(),
  );
  if (invalidAttribute) {
    return 'All attributes must have an ID and label.';
  }

  return null;
}

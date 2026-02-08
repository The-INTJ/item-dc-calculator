/**
 * Default contest configuration templates.
 *
 * @deprecated This file is deprecated. Contest configurations should be
 * stored in the datastore and managed via the /api/contest/configs endpoints.
 * See the JSON payloads below to recreate these configs via POST /api/contest/configs.
 */

import type { ContestConfig } from '../../contexts/contest/contestTypes';

export const DEFAULT_CONFIG: ContestConfig = {
  topic: 'Mixology',
  entryLabel: 'Drink',
  entryLabelPlural: 'Drinks',
  attributes: [
    { id: 'aroma', label: 'Aroma', description: 'How appealing is the scent?' },
    { id: 'taste', label: 'Taste', description: 'How well do the flavors work together?' },
    { id: 'presentation', label: 'Presentation', description: 'Visual appeal and garnish' },
    { id: 'xFactor', label: 'xFactor', description: 'Originality and innovation' },
    { id: 'overall', label: 'Overall', description: 'Overall impression' },
  ],
};

export const CHILI_CONFIG: ContestConfig = {
  topic: 'Chili',
  entryLabel: 'Chili',
  entryLabelPlural: 'Chilies',
  attributes: [
    { id: 'heat', label: 'Heat', description: 'Spiciness level and heat balance' },
    { id: 'flavor', label: 'Flavor', description: 'Depth and complexity of taste' },
    { id: 'texture', label: 'Texture', description: 'Consistency and mouthfeel' },
    { id: 'appearance', label: 'Appearance', description: 'Visual presentation' },
    { id: 'overall', label: 'Overall', description: 'Overall impression' },
  ],
};

export const COSPLAY_CONFIG: ContestConfig = {
  topic: 'Cosplay',
  entryLabel: 'Cosplay',
  entryLabelPlural: 'Cosplays',
  attributes: [
    { id: 'accuracy', label: 'Accuracy', description: 'Faithfulness to source material' },
    { id: 'craftsmanship', label: 'Craftsmanship', description: 'Quality of construction' },
    { id: 'presentation', label: 'Presentation', description: 'Stage presence and posing' },
    { id: 'creativity', label: 'Creativity', description: 'Original interpretation or design' },
  ],
};

export const DANCE_CONFIG: ContestConfig = {
  topic: 'Dance',
  entryLabel: 'Performance',
  entryLabelPlural: 'Performances',
  attributes: [
    { id: 'technique', label: 'Technique', description: 'Technical skill execution' },
    { id: 'musicality', label: 'Musicality', description: 'Rhythm and musical interpretation' },
    { id: 'expression', label: 'Expression', description: 'Emotional delivery and storytelling' },
    { id: 'difficulty', label: 'Difficulty', description: 'Complexity of choreography' },
    { id: 'overall', label: 'Overall', description: 'Overall impression' },
  ],
};

export const DEFAULT_TEMPLATES: Record<string, ContestConfig> = {
  mixology: DEFAULT_CONFIG,
  chili: CHILI_CONFIG,
  cosplay: COSPLAY_CONFIG,
  dance: DANCE_CONFIG,
};

export function getTemplate(key: string): ContestConfig | undefined {
  return DEFAULT_TEMPLATES[key.toLowerCase()];
}

export function getTemplateKeys(): string[] {
  return Object.keys(DEFAULT_TEMPLATES);
}

/**
 * Get a default config.
 */
export function getDefaultConfig(): ContestConfig {
  const firstTemplateKey = Object.keys(DEFAULT_TEMPLATES)[0];
  return DEFAULT_TEMPLATES[firstTemplateKey] ?? DEFAULT_CONFIG;
}

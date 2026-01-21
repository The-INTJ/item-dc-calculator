/**
 * Default contest configuration templates.
 *
 * These templates provide ready-to-use configurations for common contest types.
 * Admins can select from these or create custom configurations via JSON.
 */

import type { ContestConfig } from './types';

// ============================================================================
// Template Definitions
// ============================================================================

export const MIXOLOGY_CONFIG: ContestConfig = {
  topic: 'Mixology',
  entryLabel: 'Drink',
  entryLabelPlural: 'Drinks',
  attributes: [
    { id: 'aroma', label: 'Aroma', description: 'How appealing is the scent?' },
    { id: 'balance', label: 'Balance', description: 'How well do the flavors work together?' },
    { id: 'presentation', label: 'Presentation', description: 'Visual appeal and garnish' },
    { id: 'creativity', label: 'Creativity', description: 'Originality and innovation' },
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
    { id: 'craftsmanship', label: 'Craftsmanship', description: 'Quality of construction and materials' },
    { id: 'presentation', label: 'Presentation', description: 'Stage presence and posing' },
    { id: 'creativity', label: 'Creativity', description: 'Original interpretation or design choices' },
  ],
};

export const DANCE_CONFIG: ContestConfig = {
  topic: 'Dance',
  entryLabel: 'Performance',
  entryLabelPlural: 'Performances',
  attributes: [
    { id: 'technique', label: 'Technique', description: 'Technical skill and execution' },
    { id: 'musicality', label: 'Musicality', description: 'Rhythm and musical interpretation' },
    { id: 'expression', label: 'Expression', description: 'Emotional delivery and storytelling' },
    { id: 'difficulty', label: 'Difficulty', description: 'Complexity of choreography' },
    { id: 'overall', label: 'Overall', description: 'Overall impression' },
  ],
};

export const BAKING_CONFIG: ContestConfig = {
  topic: 'Baking',
  entryLabel: 'Bake',
  entryLabelPlural: 'Bakes',
  attributes: [
    { id: 'taste', label: 'Taste', description: 'Flavor and deliciousness' },
    { id: 'texture', label: 'Texture', description: 'Consistency and mouthfeel' },
    { id: 'appearance', label: 'Appearance', description: 'Visual presentation and decoration' },
    { id: 'creativity', label: 'Creativity', description: 'Originality and innovation' },
    { id: 'technique', label: 'Technique', description: 'Baking skill demonstrated' },
  ],
};

export const BBQ_CONFIG: ContestConfig = {
  topic: 'BBQ',
  entryLabel: 'Entry',
  entryLabelPlural: 'Entries',
  attributes: [
    { id: 'taste', label: 'Taste', description: 'Overall flavor profile' },
    { id: 'tenderness', label: 'Tenderness', description: 'Texture and bite' },
    { id: 'appearance', label: 'Appearance', description: 'Visual presentation' },
    { id: 'smoke', label: 'Smoke', description: 'Smoke ring and smokiness' },
  ],
};

// ============================================================================
// Template Registry
// ============================================================================

export const DEFAULT_TEMPLATES: Record<string, ContestConfig> = {
  mixology: MIXOLOGY_CONFIG,
  chili: CHILI_CONFIG,
  cosplay: COSPLAY_CONFIG,
  dance: DANCE_CONFIG,
  baking: BAKING_CONFIG,
  bbq: BBQ_CONFIG,
};

/**
 * Get a template by key (case-insensitive).
 */
export function getTemplate(key: string): ContestConfig | undefined {
  return DEFAULT_TEMPLATES[key.toLowerCase()];
}

/**
 * Get list of all available templates.
 */
export function getTemplateList(): Array<{ key: string; config: ContestConfig }> {
  return Object.entries(DEFAULT_TEMPLATES).map(([key, config]) => ({ key, config }));
}

/**
 * Get template keys only.
 */
export function getTemplateKeys(): string[] {
  return Object.keys(DEFAULT_TEMPLATES);
}

/**
 * Clone a template config (deep copy to prevent mutation).
 */
export function cloneConfig(config: ContestConfig): ContestConfig {
  return {
    ...config,
    attributes: config.attributes.map((attr) => ({ ...attr })),
  };
}

/**
 * Get the default template (Mixology for backward compatibility).
 */
export function getDefaultTemplate(): ContestConfig {
  return cloneConfig(MIXOLOGY_CONFIG);
}

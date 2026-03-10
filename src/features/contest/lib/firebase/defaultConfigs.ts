import type { ContestConfigItem } from '../../contexts/contest/contestTypes';

/**
 * Default configurations used for initial seeding.
 */
export const DEFAULT_CONFIGS: ContestConfigItem[] = [
  {
    id: 'mixology',
    topic: 'Mixology',
    entryLabel: 'Drink',
    entryLabelPlural: 'Drinks',
    attributes: [
      { id: 'aroma', label: 'Aroma', description: 'How appealing is the scent?', min: 0, max: 10 },
      { id: 'taste', label: 'Taste', description: 'How well do the flavors work together?', min: 0, max: 10 },
      { id: 'presentation', label: 'Presentation', description: 'Visual appeal and garnish', min: 0, max: 10 },
      { id: 'xFactor', label: 'xFactor', description: 'Originality and innovation', min: 0, max: 10 },
      { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
    ],
  },
  {
    id: 'chili',
    topic: 'Chili',
    entryLabel: 'Chili',
    entryLabelPlural: 'Chilies',
    attributes: [
      { id: 'heat', label: 'Heat', description: 'Spiciness level and heat balance', min: 0, max: 10 },
      { id: 'flavor', label: 'Flavor', description: 'Depth and complexity of taste', min: 0, max: 10 },
      { id: 'texture', label: 'Texture', description: 'Consistency and mouthfeel', min: 0, max: 10 },
      { id: 'appearance', label: 'Appearance', description: 'Visual presentation', min: 0, max: 10 },
      { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
    ],
  },
  {
    id: 'cosplay',
    topic: 'Cosplay',
    entryLabel: 'Cosplay',
    entryLabelPlural: 'Cosplays',
    attributes: [
      { id: 'accuracy', label: 'Accuracy', description: 'Faithfulness to source material', min: 0, max: 10 },
      { id: 'craftsmanship', label: 'Craftsmanship', description: 'Quality of construction', min: 0, max: 10 },
      { id: 'presentation', label: 'Presentation', description: 'Stage presence and posing', min: 0, max: 10 },
      { id: 'creativity', label: 'Creativity', description: 'Original interpretation or design', min: 0, max: 10 },
    ],
  },
  {
    id: 'dance',
    topic: 'Dance',
    entryLabel: 'Performance',
    entryLabelPlural: 'Performances',
    attributes: [
      { id: 'technique', label: 'Technique', description: 'Technical skill execution', min: 0, max: 10 },
      { id: 'musicality', label: 'Musicality', description: 'Rhythm and musical interpretation', min: 0, max: 10 },
      { id: 'expression', label: 'Expression', description: 'Emotional delivery and storytelling', min: 0, max: 10 },
      { id: 'difficulty', label: 'Difficulty', description: 'Complexity of choreography', min: 0, max: 10 },
      { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
    ],
  },
];


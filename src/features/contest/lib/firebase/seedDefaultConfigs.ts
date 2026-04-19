/**
 * Seeds default contest configurations into Firestore.
 *
 * Creates the 4 default configs (mixology, chili, cosplay, dance) on first app
 * run. Idempotent — if the configs collection already has documents, seeding
 * is skipped.
 */

import type { ContestConfigItem } from '../../contexts/contest/contestTypes';
import type { FirestoreAdapter } from './firestoreAdapter';

const DEFAULT_CONFIGS: ContestConfigItem[] = [
  {
    id: 'mixology',
    topic: 'Mixology',
    entryLabel: 'Drink',
    entryLabelPlural: 'Drinks',
    contestantLabel: 'Mixologist',
    contestantLabelPlural: 'Mixologists',
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
    contestantLabel: 'Chef',
    contestantLabelPlural: 'Chefs',
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
    contestantLabel: 'Cosplayer',
    contestantLabelPlural: 'Cosplayers',
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
    contestantLabel: 'Dancer',
    contestantLabelPlural: 'Dancers',
    attributes: [
      { id: 'technique', label: 'Technique', description: 'Technical skill execution', min: 0, max: 10 },
      { id: 'musicality', label: 'Musicality', description: 'Rhythm and musical interpretation', min: 0, max: 10 },
      { id: 'expression', label: 'Expression', description: 'Emotional delivery and storytelling', min: 0, max: 10 },
      { id: 'difficulty', label: 'Difficulty', description: 'Complexity of choreography', min: 0, max: 10 },
      { id: 'overall', label: 'Overall', description: 'Overall impression', min: 0, max: 10 },
    ],
  },
];

export async function seedDefaultConfigs(adapter: FirestoreAdapter): Promise<void> {
  if (!adapter.isReady()) {
    console.log('[Seed] Firebase not initialized, skipping seeding');
    return;
  }

  try {
    const existing = await adapter.listConfigs();
    if (existing.length > 0) {
      console.log(`[Seed] Configs collection already has ${existing.length} configs, skipping seeding`);
      return;
    }

    for (const config of DEFAULT_CONFIGS) {
      const { id, ...data } = config;
      await adapter.createConfig(id, data);
      console.log(`[Seed] Created config: ${id}`);
    }

    console.log('[Seed] Successfully seeded 4 default configs');
  } catch (error) {
    console.error('[Seed] Error seeding default configs:', error);
    throw error;
  }
}

/**
 * Seeds default contest configurations into Firestore.
 *
 * This module is responsible for creating the 4 default contest configurations
 * (mixology, chili, cosplay, dance) on first app run. It's idempotent - if
 * configs already exist, seeding is skipped.
 */

import { collection, getDocs, setDoc, doc, type Firestore } from 'firebase/firestore';
import type { ContestConfigItem } from '../../contexts/contest/contestTypes';
import type { FirestoreAdapter } from './firestoreAdapter';

const CONFIGS_COLLECTION = 'configs';

/**
 * Default configurations for seeding.
 * These are based on the original contestTemplates.ts configurations.
 */
const DEFAULT_CONFIGS: ContestConfigItem[] = [
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

/**
 * Seeds default contest configurations into Firestore.
 *
 * This function checks if the configs collection is empty. If it is, it creates
 * the 4 default configs. If configs already exist, it returns early (idempotent).
 *
 * @param adapter - The Firestore adapter for database operations
 * @throws Error if seeding fails (but the function is wrapped in try-catch in the provider)
 */
export async function seedDefaultConfigs(adapter: FirestoreAdapter): Promise<void> {
  const db = adapter.getDb();
  if (!db) {
    console.log('[Seed] Firebase not initialized, skipping seeding');
    return;
  }

  try {
    // Check if configs collection is empty
    const configsSnapshot = await getDocs(collection(db, CONFIGS_COLLECTION));

    if (!configsSnapshot.empty) {
      console.log(`[Seed] Configs collection already has ${configsSnapshot.size} configs, skipping seeding`);
      return;
    }

    // Seed all default configs
    for (const config of DEFAULT_CONFIGS) {
      await setDoc(doc(db, CONFIGS_COLLECTION, config.id), config);
      console.log(`[Seed] Created config: ${config.id}`);
    }

    console.log('[Seed] Successfully seeded 4 default configs');
  } catch (error) {
    console.error('[Seed] Error seeding default configs:', error);
    throw error;
  }
}

/**
 * Migration script: Convert existing mixology data to new contest config schema
 *
 * This script migrates existing Firestore data from the old schema to the new schema:
 * 1. Adds config: ContestConfig to each contest (using MIXOLOGY_CONFIG)
 * 2. Renames drinks[] → entries[]
 * 3. Renames drinkId → entryId in scores
 * 4. Renames currentDrinkId → currentEntryId
 * 5. Removes categories[] (replaced by config.attributes)
 *
 * Prerequisites:
 *   npm install firebase-admin
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/migrate-to-contest-config.js [--dry-run]
 *
 * Options:
 *   --dry-run  Preview changes without writing to Firestore
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Old collection name
const OLD_COLLECTION = 'mixology_contests';
// New collection name
const NEW_COLLECTION = 'contests';

// Default mixology config for migrated contests
const MIXOLOGY_CONFIG = {
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

interface OldDrink {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  scoreByUser?: Record<string, Record<string, number>>;
  scoreTotals?: Record<string, number>;
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

interface OldScoreEntry {
  id: string;
  drinkId: string;
  judgeId: string;
  breakdown: Record<string, number>;
  notes?: string;
}

interface OldContest {
  id: string;
  name: string;
  slug: string;
  phase: string;
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentDrinkId?: string;
  defaultContest?: boolean;
  categories?: Array<{ id: string; label: string; sortOrder: number }>;
  drinks: OldDrink[];
  judges: Array<{ id: string; displayName: string; role: string; contact?: string }>;
  scores: OldScoreEntry[];
}

interface NewEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  scoreByUser?: Record<string, Record<string, number>>;
  scoreTotals?: Record<string, number>;
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

interface NewScoreEntry {
  id: string;
  entryId: string;
  judgeId: string;
  breakdown: Record<string, number>;
  notes?: string;
}

interface NewContest {
  id: string;
  name: string;
  slug: string;
  phase: string;
  config: typeof MIXOLOGY_CONFIG;
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentEntryId?: string;
  defaultContest?: boolean;
  entries: NewEntry[];
  judges: Array<{ id: string; displayName: string; role: string; contact?: string }>;
  scores: NewScoreEntry[];
}

function migrateContest(old: OldContest): NewContest {
  // Convert drinks to entries
  const entries: NewEntry[] = old.drinks.map((drink) => ({
    id: drink.id.replace(/^drink-/, 'entry-'),
    name: drink.name,
    slug: drink.slug,
    description: drink.description,
    round: drink.round,
    submittedBy: drink.submittedBy,
    scoreByUser: drink.scoreByUser,
    scoreTotals: drink.scoreTotals,
    scoreLock: drink.scoreLock,
  }));

  // Create ID mapping for score migration
  const idMap = new Map<string, string>();
  old.drinks.forEach((drink, i) => {
    idMap.set(drink.id, entries[i].id);
  });

  // Convert scores
  const scores: NewScoreEntry[] = old.scores.map((score) => ({
    id: score.id,
    entryId: idMap.get(score.drinkId) ?? score.drinkId.replace(/^drink-/, 'entry-'),
    judgeId: score.judgeId,
    breakdown: score.breakdown,
    notes: score.notes,
  }));

  // Build new contest
  const newContest: NewContest = {
    id: old.id,
    name: old.name,
    slug: old.slug,
    phase: old.phase,
    config: MIXOLOGY_CONFIG,
    location: old.location,
    startTime: old.startTime,
    bracketRound: old.bracketRound,
    currentEntryId: old.currentDrinkId
      ? idMap.get(old.currentDrinkId) ?? old.currentDrinkId.replace(/^drink-/, 'entry-')
      : undefined,
    defaultContest: old.defaultContest,
    entries,
    judges: old.judges,
    scores,
  };

  return newContest;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('Contest Config Migration Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    // Check for service account credentials
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
      console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.');
      console.error('Set it to the path of your Firebase service account JSON file.');
      process.exit(1);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log(`Initialized Firebase with project: ${serviceAccount.project_id}`);
    } catch (err) {
      console.error('Error loading service account credentials:', err);
      process.exit(1);
    }
  }

  const db = getFirestore();

  // Fetch old contests
  console.log(`\nFetching contests from '${OLD_COLLECTION}'...`);
  const oldSnapshot = await db.collection(OLD_COLLECTION).get();

  if (oldSnapshot.empty) {
    console.log('No contests found in old collection. Nothing to migrate.');
    return;
  }

  console.log(`Found ${oldSnapshot.size} contest(s) to migrate.\n`);

  const migratedContests: NewContest[] = [];

  for (const doc of oldSnapshot.docs) {
    const oldContest = { id: doc.id, ...doc.data() } as OldContest;
    console.log(`Processing: ${oldContest.name} (${oldContest.id})`);
    console.log(`  - ${oldContest.drinks.length} drinks → entries`);
    console.log(`  - ${oldContest.scores.length} scores to update`);
    console.log(`  - ${oldContest.judges.length} judges (unchanged)`);

    const newContest = migrateContest(oldContest);
    migratedContests.push(newContest);

    if (!isDryRun) {
      // Write to new collection
      await db.collection(NEW_COLLECTION).doc(newContest.id).set({
        ...newContest,
        migratedAt: new Date(),
        migratedFrom: OLD_COLLECTION,
      });
      console.log(`  ✓ Written to '${NEW_COLLECTION}/${newContest.id}'`);
    } else {
      console.log(`  [DRY RUN] Would write to '${NEW_COLLECTION}/${newContest.id}'`);
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total contests processed: ${migratedContests.length}`);
  console.log(
    `Total entries migrated: ${migratedContests.reduce((sum, c) => sum + c.entries.length, 0)}`
  );
  console.log(
    `Total scores migrated: ${migratedContests.reduce((sum, c) => sum + c.scores.length, 0)}`
  );

  if (isDryRun) {
    console.log('\n[DRY RUN] No changes were made. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✓ Migration complete!');
    console.log(`\nNote: Old data in '${OLD_COLLECTION}' was NOT deleted.`);
    console.log('After verifying the migration, you can manually delete the old collection.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

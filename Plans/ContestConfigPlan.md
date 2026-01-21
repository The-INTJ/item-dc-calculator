# ContestConfig Implementation

## Overview

The application is now a **general-purpose contest platform** that can handle any type of judging competition (mixology, chili cook-offs, cosplay, dance, etc.) through configurable `ContestConfig`.

### Key Changes from Original Mixology-Only Design

| Before | After |
|--------|-------|
| `Drink` | `Entry` |
| `drinks` | `entries` |
| `drinkId` | `entryId` |
| Hardcoded 5 scoring categories | Dynamic `config.attributes` |
| Mixology-only | Any contest type via templates |

---

## Core Types

```typescript
interface ContestConfig {
  topic: string;                    // e.g., "Mixology", "Chili", "Cosplay"
  attributes: AttributeConfig[];    // Scoring dimensions
  entryLabel?: string;              // What entries are called (default: "Entry")
  entryLabelPlural?: string;        // Plural form (default: "Entries")
}

interface AttributeConfig {
  id: string;           // Unique identifier (e.g., "aroma", "heat")
  label: string;        // Display name
  description?: string; // Helper text for judges
  min?: number;         // Min score (default: 0)
  max?: number;         // Max score (default: 10)
}
```

---

## For Developers: Adding New Contest Templates

### 1. Add Template to `src/features/mixology/types/templates.ts`

```typescript
export const BBQ_CONFIG: ContestConfig = {
  topic: 'BBQ',
  entryLabel: 'Entry',
  entryLabelPlural: 'Entries',
  attributes: [
    { id: 'smoke', label: 'Smoke', description: 'Smoke ring and smoky flavor' },
    { id: 'tenderness', label: 'Tenderness', description: 'Meat texture and pull' },
    { id: 'flavor', label: 'Flavor', description: 'Overall taste profile' },
    { id: 'appearance', label: 'Appearance', description: 'Visual presentation' },
    { id: 'overall', label: 'Overall', description: 'Overall impression' },
  ],
};

// Add to DEFAULT_TEMPLATES
export const DEFAULT_TEMPLATES: Record<string, ContestConfig> = {
  mixology: MIXOLOGY_CONFIG,
  chili: CHILI_CONFIG,
  cosplay: COSPLAY_CONFIG,
  dance: DANCE_CONFIG,
  bbq: BBQ_CONFIG,  // Add new template
};
```

### 2. Export from Index (if needed)

```typescript
// src/features/mixology/types/index.ts
export { BBQ_CONFIG } from './templates';
```

That's it. The new template is immediately available for use.

---

## For Developers: Using ContestConfig in Code

### Getting the Config for a Contest

```typescript
import { getEffectiveConfig } from '@/mixology/types';

// Returns contest.config or falls back to MIXOLOGY_CONFIG
const config = getEffectiveConfig(contest);

// Access attributes
config.attributes.forEach(attr => {
  console.log(attr.id, attr.label, attr.description);
});
```

### Validating Scores Against Config

```typescript
import { isValidAttributeId, validateBreakdown, createEmptyBreakdown } from '@/mixology/types';

// Check if a category ID is valid
if (!isValidAttributeId('aroma', config)) {
  throw new Error('Invalid category');
}

// Validate a full breakdown
const errors = validateBreakdown(breakdown, config);
if (errors.length > 0) {
  throw new Error(errors.join(', '));
}

// Create empty breakdown with all attributes set to 0
const emptyBreakdown = createEmptyBreakdown(config);
```

### Getting Template by Key

```typescript
import { getTemplate, getTemplateKeys } from '@/mixology/types';

// Get specific template
const chiliConfig = getTemplate('chili');

// List all available templates
const keys = getTemplateKeys(); // ['mixology', 'chili', 'cosplay', 'dance']
```

---

## For Admins: Creating Contests with Different Types

### Option 1: Use a Built-in Template

When creating a contest via API or admin UI, specify the template:

```json
POST /api/mixology/contests
{
  "name": "Summer Chili Showdown",
  "slug": "summer-chili-2024",
  "configTemplate": "chili"
}
```

### Option 2: Provide Custom Config

For contest types not covered by templates:

```json
POST /api/mixology/contests
{
  "name": "Photography Contest",
  "slug": "photo-contest-2024",
  "config": {
    "topic": "Photography",
    "entryLabel": "Photo",
    "entryLabelPlural": "Photos",
    "attributes": [
      { "id": "composition", "label": "Composition", "description": "Framing and balance" },
      { "id": "lighting", "label": "Lighting", "description": "Use of light and shadow" },
      { "id": "creativity", "label": "Creativity", "description": "Originality and vision" },
      { "id": "technical", "label": "Technical", "description": "Focus, exposure, clarity" },
      { "id": "overall", "label": "Overall", "description": "Overall impression" }
    ]
  }
}
```

### Attribute ID Rules

- Must be lowercase alphanumeric with underscores
- Must start with a letter
- Must be unique within the config
- Examples: `aroma`, `heat_level`, `stage_presence`

---

## Available Templates

| Template | Topic | Entry Label | Attributes |
|----------|-------|-------------|------------|
| `mixology` | Mixology | Drink | aroma, balance, presentation, creativity, overall |
| `chili` | Chili | Chili | heat, flavor, texture, appearance, overall |
| `cosplay` | Cosplay | Cosplay | accuracy, craftsmanship, presentation, creativity |
| `dance` | Dance | Performance | technique, musicality, expression, difficulty, overall |

---

## Data Migration

Existing Firestore data uses the old `drinks`/`drinkId` format. The code handles both formats via fallbacks:

```typescript
// Code automatically handles both old and new data
const entries = contest.entries ?? contest.drinks ?? [];
const entryId = score.entryId ?? score.drinkId;
```

To migrate existing data to the new format, run:

```bash
node scripts/migrate-to-contest-config.js --dry-run  # Preview changes
node scripts/migrate-to-contest-config.js            # Execute migration
```

The migration script:
1. Adds `config: MIXOLOGY_CONFIG` to contests without a config
2. Renames `drinks` → `entries`
3. Renames `drinkId` → `entryId` in scores
4. Renames `currentDrinkId` → `currentEntryId`

---

## File Locations

| Purpose | Location |
|---------|----------|
| Core types | `src/features/mixology/types/types.ts` |
| Templates | `src/features/mixology/types/templates.ts` |
| Validation | `src/features/mixology/types/validation.ts` |
| Backend types | `src/features/mixology/server/backend/types.ts` |
| In-memory provider | `src/features/mixology/server/backend/inMemoryProvider.ts` |
| Firebase provider | `src/features/mixology/server/firebase/firebaseBackendProvider.ts` |
| Migration script | `scripts/migrate-to-contest-config.js` |

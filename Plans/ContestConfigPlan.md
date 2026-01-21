# ContestConfig Implementation Plan

## Implementation Status

| Step | Status | Notes |
|------|--------|-------|
| 1. Define new types | ✅ Complete | `src/contest/types.ts` |
| 2. Create templates | ✅ Complete | `src/contest/templates.ts` - 6 templates |
| 3. Add validation | ✅ Complete | `src/contest/validation.ts` |
| 4. Backend provider types | ✅ Complete | `src/contest/backend/types.ts` |
| 5. In-memory provider | ✅ Complete | `src/contest/backend/inMemoryProvider.ts` |
| 6. Firebase provider | ✅ Complete | `src/contest/firebase/` |
| 7. Auth modules | ✅ Complete | `src/contest/auth/` |
| 8. Migration script | ✅ Complete | `scripts/migrate-to-contest-config.ts` |
| 9. API routes | ⏳ Pending | Need to create `app/api/contests/` |
| 10. UI components | ⏳ Pending | Need to update imports |
| 11. Update imports | ⏳ Pending | Switch from mixology to contest |

---

## Overview

Transform the application from a Mixology-specific contest judging tool into a **general-purpose contest platform** that can handle any type of judging competition (mixology, chili cook-offs, cosplay, dance, etc.) through configurable contest attributes.

## Goals

1. **Extensibility** - Easy to add new contest types without code changes
2. **Code Cleanliness** - Remove hardcoded mixology-specific logic in favor of dynamic configuration
3. **Simple Admin UX** - Contest admins can select from templates or create custom configs via JSON

## Non-Goals

- Full backward compatibility with existing data (migration script will be provided)
- Complex UI-based config builder (JSON interface is sufficient for MVP)

---

## Core Concept: ContestConfig

A `ContestConfig` defines the shape of a contest:

```typescript
interface ContestConfig {
  topic: string;                    // e.g., "Mixology", "Chili", "Cosplay"
  attributes: AttributeConfig[];    // Scoring dimensions
  entryLabel?: string;              // What entries are called (default: "Entry")
  entryLabelPlural?: string;        // Plural form (default: "Entries")
}

interface AttributeConfig {
  id: string;                       // Unique identifier (e.g., "aroma", "heat")
  label: string;                    // Display name (e.g., "Aroma", "Heat Level")
  description?: string;             // Optional helper text for judges
  weight?: number;                  // Optional weight for scoring (default: 1)
  min?: number;                     // Min score value (default: 0)
  max?: number;                     // Max score value (default: 10)
}
```

### Example Configurations

```json
// Mixology (current functionality)
{
  "topic": "Mixology",
  "entryLabel": "Drink",
  "entryLabelPlural": "Drinks",
  "attributes": [
    { "id": "aroma", "label": "Aroma", "description": "How appealing is the scent?" },
    { "id": "balance", "label": "Balance", "description": "How well do the flavors work together?" },
    { "id": "presentation", "label": "Presentation", "description": "Visual appeal and garnish" },
    { "id": "creativity", "label": "Creativity", "description": "Originality and innovation" },
    { "id": "overall", "label": "Overall", "description": "Overall impression" }
  ]
}

// Chili Cook-Off
{
  "topic": "Chili",
  "entryLabel": "Chili",
  "entryLabelPlural": "Chilies",
  "attributes": [
    { "id": "heat", "label": "Heat", "description": "Spiciness level and heat balance" },
    { "id": "flavor", "label": "Flavor", "description": "Depth and complexity of taste" },
    { "id": "texture", "label": "Texture", "description": "Consistency and mouthfeel" },
    { "id": "appearance", "label": "Appearance", "description": "Visual presentation" },
    { "id": "overall", "label": "Overall", "description": "Overall impression" }
  ]
}

// Cosplay
{
  "topic": "Cosplay",
  "entryLabel": "Cosplay",
  "entryLabelPlural": "Cosplays",
  "attributes": [
    { "id": "accuracy", "label": "Accuracy", "description": "Faithfulness to source material" },
    { "id": "craftsmanship", "label": "Craftsmanship", "description": "Quality of construction" },
    { "id": "presentation", "label": "Presentation", "description": "Stage presence and posing" },
    { "id": "creativity", "label": "Creativity", "description": "Original interpretation or design" }
  ]
}

// Dance Competition
{
  "topic": "Dance",
  "entryLabel": "Performance",
  "entryLabelPlural": "Performances",
  "attributes": [
    { "id": "technique", "label": "Technique", "description": "Technical skill execution" },
    { "id": "musicality", "label": "Musicality", "description": "Rhythm and musical interpretation" },
    { "id": "expression", "label": "Expression", "description": "Emotional delivery and storytelling" },
    { "id": "difficulty", "label": "Difficulty", "description": "Complexity of choreography" },
    { "id": "overall", "label": "Overall", "description": "Overall impression" }
  ]
}
```

---

## Implementation Steps

### Step 1: Define New Types

**File:** `src/mixology/types.ts` → rename to `src/contest/types.ts`

```typescript
// ContestConfig types
export interface AttributeConfig {
  id: string;
  label: string;
  description?: string;
  weight?: number;
  min?: number;
  max?: number;
}

export interface ContestConfig {
  topic: string;
  attributes: AttributeConfig[];
  entryLabel?: string;
  entryLabelPlural?: string;
}

// Dynamic ScoreBreakdown - replaces hardcoded interface
export type ScoreBreakdown = Record<string, number>;

// Entry replaces Drink - generic entry in a contest
export interface Entry {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  scoreByUser?: Record<string, ScoreBreakdown>;
  scoreTotals?: ScoreBreakdown;
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

// Updated Contest with config
export interface Contest {
  id: string;
  name: string;
  slug: string;
  phase: ContestPhase;
  config: ContestConfig;              // NEW: replaces hardcoded categories
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentEntryId?: string;            // renamed from currentDrinkId
  defaultContest?: boolean;
  entries: Entry[];                   // renamed from drinks
  judges: Judge[];
  scores: ScoreEntry[];
}

// ScoreEntry with dynamic breakdown
export interface ScoreEntry {
  id: string;
  entryId: string;                    // renamed from drinkId
  judgeId: string;
  breakdown: ScoreBreakdown;          // now dynamic
  notes?: string;
}
```

### Step 2: Create Default Config Templates

**File:** `src/contest/templates.ts`

```typescript
import type { ContestConfig } from './types';

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
  mixology: MIXOLOGY_CONFIG,
  chili: CHILI_CONFIG,
  cosplay: COSPLAY_CONFIG,
  dance: DANCE_CONFIG,
};

export function getTemplate(key: string): ContestConfig | undefined {
  return DEFAULT_TEMPLATES[key.toLowerCase()];
}

export function getTemplateList(): Array<{ key: string; config: ContestConfig }> {
  return Object.entries(DEFAULT_TEMPLATES).map(([key, config]) => ({ key, config }));
}
```

### Step 3: Add Config Validation

**File:** `src/contest/validation.ts`

```typescript
import type { ContestConfig, AttributeConfig, ScoreBreakdown } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateContestConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] };
  }

  const c = config as Record<string, unknown>;

  // Validate topic
  if (typeof c.topic !== 'string' || c.topic.trim().length === 0) {
    errors.push('topic is required and must be a non-empty string');
  }

  // Validate attributes
  if (!Array.isArray(c.attributes)) {
    errors.push('attributes must be an array');
  } else if (c.attributes.length === 0) {
    errors.push('attributes must have at least one item');
  } else {
    const ids = new Set<string>();
    c.attributes.forEach((attr, i) => {
      const attrErrors = validateAttribute(attr, i);
      errors.push(...attrErrors);

      if (typeof attr === 'object' && attr !== null && 'id' in attr) {
        if (ids.has(attr.id as string)) {
          errors.push(`attributes[${i}]: duplicate id "${attr.id}"`);
        }
        ids.add(attr.id as string);
      }
    });
  }

  // Validate optional labels
  if (c.entryLabel !== undefined && typeof c.entryLabel !== 'string') {
    errors.push('entryLabel must be a string if provided');
  }
  if (c.entryLabelPlural !== undefined && typeof c.entryLabelPlural !== 'string') {
    errors.push('entryLabelPlural must be a string if provided');
  }

  return { valid: errors.length === 0, errors };
}

function validateAttribute(attr: unknown, index: number): string[] {
  const prefix = `attributes[${index}]`;
  const errors: string[] = [];

  if (!attr || typeof attr !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const a = attr as Record<string, unknown>;

  if (typeof a.id !== 'string' || a.id.trim().length === 0) {
    errors.push(`${prefix}.id: required non-empty string`);
  } else if (!/^[a-z][a-z0-9_]*$/.test(a.id)) {
    errors.push(`${prefix}.id: must be lowercase alphanumeric with underscores, starting with a letter`);
  }

  if (typeof a.label !== 'string' || a.label.trim().length === 0) {
    errors.push(`${prefix}.label: required non-empty string`);
  }

  if (a.description !== undefined && typeof a.description !== 'string') {
    errors.push(`${prefix}.description: must be a string if provided`);
  }

  if (a.weight !== undefined) {
    if (typeof a.weight !== 'number' || a.weight <= 0) {
      errors.push(`${prefix}.weight: must be a positive number if provided`);
    }
  }

  if (a.min !== undefined) {
    if (typeof a.min !== 'number') {
      errors.push(`${prefix}.min: must be a number if provided`);
    }
  }

  if (a.max !== undefined) {
    if (typeof a.max !== 'number') {
      errors.push(`${prefix}.max: must be a number if provided`);
    }
  }

  if (typeof a.min === 'number' && typeof a.max === 'number' && a.min >= a.max) {
    errors.push(`${prefix}: min must be less than max`);
  }

  return errors;
}

export function validateScoreBreakdown(
  breakdown: unknown,
  config: ContestConfig
): ValidationResult {
  const errors: string[] = [];

  if (!breakdown || typeof breakdown !== 'object') {
    return { valid: false, errors: ['breakdown must be an object'] };
  }

  const b = breakdown as Record<string, unknown>;
  const validIds = new Set(config.attributes.map((a) => a.id));

  // Check all required attributes are present
  for (const attr of config.attributes) {
    if (!(attr.id in b)) {
      errors.push(`missing required attribute: ${attr.id}`);
    } else {
      const value = b[attr.id];
      if (typeof value !== 'number') {
        errors.push(`${attr.id}: must be a number`);
      } else {
        const min = attr.min ?? 0;
        const max = attr.max ?? 10;
        if (value < min || value > max) {
          errors.push(`${attr.id}: must be between ${min} and ${max}`);
        }
      }
    }
  }

  // Check for extra attributes
  for (const key of Object.keys(b)) {
    if (!validIds.has(key)) {
      errors.push(`unknown attribute: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createEmptyBreakdown(config: ContestConfig): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    breakdown[attr.id] = 0;
  }
  return breakdown;
}
```

### Step 4: Update Backend Provider Types

**File:** `src/contest/backend/types.ts`

Rename providers from "Drinks" to "Entries" and update signatures:

```typescript
export interface EntriesProvider {
  listByContest(contestId: string): Promise<ProviderResult<Entry[]>>;
  getById(contestId: string, entryId: string): Promise<ProviderResult<Entry | null>>;
  create(contestId: string, input: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>>;
  update(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>>;
  delete(contestId: string, entryId: string): Promise<ProviderResult<void>>;
}

export interface ContestBackendProvider {
  name: string;
  contests: ContestsProvider;
  entries: EntriesProvider;      // renamed from drinks
  judges: JudgesProvider;
  scores: ScoresProvider;
  initialize(): Promise<ProviderResult<void>>;
  dispose(): Promise<void>;
}
```

### Step 5: Update In-Memory Provider

**File:** `src/contest/backend/inMemoryProvider.ts`

- Remove hardcoded `defaultVoteCategories`
- Use template configs instead
- Rename `drinks` → `entries`, `drinkId` → `entryId`

### Step 6: Update Firebase Provider

**File:** `src/contest/firebase/firebaseBackendProvider.ts`

- Remove `createEmptyBreakdown()` hardcoded function
- Import `createEmptyBreakdown` from validation module
- Rename collection from `mixology_contests` to `contests`
- Update all `drink` references to `entry`

### Step 7: Update API Routes

**Files in `app/api/`:**

| Old Path | New Path |
|----------|----------|
| `app/api/mixology/contests/...` | `app/api/contests/...` |
| `app/api/mixology/contests/[id]/drinks/...` | `app/api/contests/[id]/entries/...` |

Key changes:
- Remove hardcoded `breakdownKeys` validation
- Use `validateScoreBreakdown(breakdown, contest.config)` instead
- Add new endpoint: `POST /api/contests` with optional `configTemplate` or `customConfig` body

**New endpoint for config templates:**

```typescript
// GET /api/contests/templates
// Returns list of available config templates

// POST /api/contests
// Body: { name, slug, configTemplate?: string, customConfig?: ContestConfig }
```

### Step 8: Update UI Components

**Files to update:**

1. `src/mixology/ui/VoteScorePanel.tsx`
   - Render sliders dynamically from `contest.config.attributes`
   - Use `attr.min`/`attr.max` for slider range
   - Display `attr.description` as helper text

2. `src/mixology/ui/voteUtils.ts`
   - Remove hardcoded `breakdownOrder`
   - Build order from `contest.config.attributes`

3. `src/mixology/ui/DrinkCard.tsx` → `EntryCard.tsx`
   - Rename component
   - Use `contest.config.entryLabel` for display

4. `src/mixology/data/MixologyDataContext.tsx` → `ContestDataContext.tsx`
   - Rename and update types

### Step 9: Rename Directory Structure

```
src/mixology/          →  src/contest/
├── types.ts           →  ├── types.ts
├── templates.ts           (NEW)
├── validation.ts          (NEW)
├── backend/           →  ├── backend/
│   ├── types.ts       →  │   ├── types.ts
│   ├── index.ts       →  │   ├── index.ts
│   └── inMemoryProvider.ts → └── inMemoryProvider.ts
├── firebase/          →  ├── firebase/
│   └── ...            →  │   └── ...
├── auth/              →  ├── auth/
│   └── ...            →  │   └── ...
├── ui/                →  ├── ui/
│   ├── VoteScorePanel.tsx → ├── VoteScorePanel.tsx
│   ├── voteUtils.ts   →  │   ├── voteUtils.ts
│   ├── DrinkCard.tsx  →  │   ├── EntryCard.tsx
│   └── ...            →  │   └── ...
└── data/              →  └── data/
    ├── uiTypes.ts     →      ├── uiTypes.ts
    ├── store.ts       →      ├── store.ts
    └── ContestDataContext.tsx (renamed)
```

### Step 10: Data Migration

Create a one-time migration script for existing Firestore data:

**File:** `scripts/migrate-to-contest-config.ts`

```typescript
// Migrates existing mixology_contests to new schema:
// 1. Add config: MIXOLOGY_CONFIG to each contest
// 2. Rename drinks[] → entries[]
// 3. Rename drinkId → entryId in scores
// 4. Rename currentDrinkId → currentEntryId
// 5. Remove categories[] (replaced by config.attributes)
```

---

## File Change Summary

### New Files
- `src/contest/templates.ts` - Default contest config templates
- `src/contest/validation.ts` - Config and score validation
- `scripts/migrate-to-contest-config.ts` - Data migration script
- `app/api/contests/templates/route.ts` - Template listing endpoint

### Renamed Files
- `src/mixology/` → `src/contest/`
- `DrinkCard.tsx` → `EntryCard.tsx`
- `MixologyDataContext.tsx` → `ContestDataContext.tsx`
- `MixologyBackendProvider` → `ContestBackendProvider`
- `app/api/mixology/` → `app/api/contests/`

### Modified Files
- `src/contest/types.ts` - New types, dynamic ScoreBreakdown
- `src/contest/backend/types.ts` - Rename Drinks→Entries provider
- `src/contest/backend/inMemoryProvider.ts` - Use templates, rename drinks→entries
- `src/contest/firebase/firebaseBackendProvider.ts` - Dynamic validation, renames
- `src/contest/ui/VoteScorePanel.tsx` - Dynamic slider rendering
- `src/contest/ui/voteUtils.ts` - Remove hardcoded order
- All API routes - Update paths and validation

### Deleted
- Hardcoded `defaultVoteCategories` constant
- Hardcoded `breakdownOrder` constant
- Hardcoded `createEmptyBreakdown()` function
- `categories?: VoteCategory[]` field on Contest (replaced by `config`)

---

## Testing Checklist

- [ ] Create contest with Mixology template
- [ ] Create contest with Chili template
- [ ] Create contest with custom JSON config
- [ ] Validate config rejects invalid JSON
- [ ] Validate config rejects duplicate attribute IDs
- [ ] Submit scores with all required attributes
- [ ] Reject scores with missing attributes
- [ ] Reject scores with extra attributes
- [ ] Reject scores outside min/max range
- [ ] UI renders correct number of sliders
- [ ] UI shows attribute descriptions
- [ ] Entry labels display correctly per config
- [ ] Migration script converts existing data

---

## Future Enhancements (Out of Scope)

- Visual config builder UI (drag-and-drop attributes)
- Per-attribute score weights in total calculation
- Conditional attributes (show X only if Y > threshold)
- Custom scoring scales (1-5, 1-100, letter grades)
- Import/export configs between contests

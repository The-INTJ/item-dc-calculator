---
name: migrate-to-config-api
description: Migrate from hard-coded contestTemplates.ts to using the /api/contest/configs API. Complete implementation guide with 7 phases.
argument-hint: "[phase-number]"
---

# Migrate to Config API: Complete Implementation Guide

Remove hard-coded `contestTemplates.ts` and rely entirely on the `/api/contest/configs` API. The app will auto-seed 4 default configs on first run, require explicit config selection during contest creation, and fetch all configs from the API.

## Quick Reference: 7 Phases

| Phase | Tasks | Time | Risk | Files |
|-------|-------|------|------|-------|
| 1 | Create seed module + integrate into backend init | 2-3h | Low | seedDefaultConfigs.ts, firebaseBackendProvider.ts |
| 2 | Add adapter method + update contest provider | 2-3h | Medium | firestoreAdapter.ts, contestsProvider.ts |
| 3 | Update frontend form to fetch configs | 3-4h | Medium | ContestSetupForm.tsx |
| 4 | Remove DEFAULT_CONFIG from utilities | 2-3h | High | scoreUtils.ts, validation.ts |
| 5 | Update all function call sites | 4-6h | High | Multiple files |
| 6 | Manual + automated testing | 4-6h | Medium | All areas |
| 7 | Delete deprecated file + docs | 1-2h | Low | contestTemplates.ts |

**Total: 18-27 hours** | **Critical Path: Phases 2+3 must deploy together**

---

## Phase 1: Backend Auto-Seeding (2-3 hours)

### Task 1.1: Create seedDefaultConfigs.ts Module

**Create new file:** `src/features/contest/lib/firebase/seedDefaultConfigs.ts`

This module checks if configs exist, and if not, creates 4 default configs (mixology, chili, cosplay, dance) on first run.

**Implementation steps:**

1. Import required Firebase functions and types:
```typescript
import { collection, getDocs, setDoc, doc, type Firestore } from 'firebase/firestore';
import type { ContestConfigItem } from '../../contexts/contest/contestTypes';
import type { FirestoreAdapter } from '../firestoreAdapter';
```

2. Create `seedDefaultConfigs()` function that:
   - Gets Firestore instance from adapter
   - Checks if configs collection is empty
   - If configs exist, log and return (idempotent)
   - If empty, create 4 configs with fixed IDs: `mixology`, `chili`, `cosplay`, `dance`
   - Each config includes: `id`, `topic`, `entryLabel`, `entryLabelPlural`, `attributes` array
   - Copy attribute definitions from `contestTemplates.ts` (add `min: 0, max: 10` to each)

3. Export the function with proper type signature:
```typescript
export async function seedDefaultConfigs(adapter: FirestoreAdapter): Promise<void>
```

**Reference data from contestTemplates.ts:**
- Mixology: aroma, taste, presentation, xFactor, overall
- Chili: heat, flavor, texture, appearance, overall
- Cosplay: accuracy, craftsmanship, presentation, creativity
- Dance: technique, musicality, expression, difficulty, overall

**Testing:**
- Manually clear configs collection, restart app, verify 4 configs appear in Firestore
- Restart app again, verify seeding is skipped (idempotent)

---

### Task 1.2: Integrate Seeding into Backend Initialization

**File to modify:** `src/features/contest/lib/firebase/firebaseBackendProvider.ts`

**Changes:**

1. Import the seed function (line 5):
```typescript
import { seedDefaultConfigs } from './seedDefaultConfigs';
```

2. In `initialize()` method, after Firebase is confirmed initialized (around line 46):
```typescript
if (!isFirebaseConfigured() || !db) {
  console.warn('[FirebaseBackend] Firebase not configured or unavailable; using local-only mode.');
  return success(undefined);
}

// Add seeding logic here (new code):
try {
  await seedDefaultConfigs(adapter);
} catch (err) {
  console.error('[FirebaseBackend] Failed to seed default configs:', err);
  // Don't throw - seeding failure shouldn't block app startup
}

console.log('[FirebaseBackend] Initialized');
return success(undefined);
```

**Key points:**
- Wrap seeding in try-catch so failures don't crash the app
- Log success/failure for debugging
- Allow app to start even if seeding fails

**Testing:**
- Check browser console for seeding log messages
- Verify app starts even if seeding fails
- Check Firestore to confirm configs are created

---

## Phase 2: Update Contest Creation Backend (2-3 hours)

### Task 2.1: Add Config Lookup to FirestoreAdapter

**File to modify:** `src/features/contest/lib/firebase/firestoreAdapter.ts`

**Changes:**

1. Add imports (line 7-20, add to existing imports):
```typescript
import { getDoc } from 'firebase/firestore';
```

2. Add method to interface (line 58, after `runContestTransaction`):
```typescript
/** Fetches a config by ID. Returns null if not found. */
getConfig(configId: string): Promise<ContestConfigItem | null>;
```

3. Add implementation in return object (line 160, before final closing brace):
```typescript
async getConfig(configId: string): Promise<ContestConfigItem | null> {
  const db = getDb();
  if (!db) return null;

  const docSnap = await getDoc(doc(db, 'configs', configId));
  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as ContestConfigItem;
}
```

**Testing:**
- Fetch an existing config, verify it returns full object
- Fetch non-existent config, verify it returns null
- Try with Firebase uninitialized, verify it returns null gracefully

---

### Task 2.2: Modify Contest Provider to Require configId

**File to modify:** `src/features/contest/lib/firebase/providers/contestsProvider.ts`

**Changes:**

1. **Remove old import (line 10):**
```typescript
// DELETE: import { getTemplate, getDefaultConfig } from '../../helpers/contestTemplates';
```

2. **Update ContestCreateInput interface (lines 13-20):**
```typescript
interface ContestCreateInput {
  name: string;
  slug: string;
  configId: string; // CHANGED: was optional configTemplate?: string
  entryLabel?: string;
  entryLabelPlural?: string;
}
```

3. **Replace config resolution logic (lines 39-61):**

**OLD CODE TO REPLACE:**
```typescript
// OLD: Lines 44-51
let resolvedConfig = typedInput.config;
if (!resolvedConfig && typedInput.configTemplate) {
  resolvedConfig = getTemplate(typedInput.configTemplate);
}
if (!resolvedConfig) {
  resolvedConfig = getDefaultConfig();
}
```

**NEW CODE:**
```typescript
// NEW: Fetch config from API
const configItem = await adapter.getConfig(typedInput.configId);
if (!configItem) {
  throw new Error(`Config not found: ${typedInput.configId}`);
}

let resolvedConfig: ContestConfig = {
  topic: configItem.topic,
  attributes: configItem.attributes,
  entryLabel: configItem.entryLabel,
  entryLabelPlural: configItem.entryLabelPlural,
};
```

4. **Keep the entry label override logic (unchanged):**
```typescript
// Apply entry label overrides if provided (KEEP THIS PART)
if (typedInput.entryLabel || typedInput.entryLabelPlural) {
  resolvedConfig = {
    ...resolvedConfig,
    entryLabel: typedInput.entryLabel || resolvedConfig.entryLabel,
    entryLabelPlural: typedInput.entryLabelPlural || resolvedConfig.entryLabelPlural,
  };
}
```

**Breaking change warning:**
- Any code calling `provider.contests.create()` must now send `configId` instead of `configTemplate`
- Update frontend (Phase 3) at the same time as this change

**Testing:**
- Create contest with valid configId, verify it succeeds
- Create contest with invalid configId, verify it throws error with message
- Create contest with entry label overrides, verify they're applied

---

## Phase 3: Update Frontend Contest Creation (3-4 hours)

### Task 3.1: Update ContestSetupForm to Fetch Configs from API

**File to modify:** `src/features/contest/components/admin/ContestSetupForm.tsx`

**Changes:**

1. **Update imports (line 10):**

**REMOVE:**
```typescript
// DELETE: import { getTemplateKeys, DEFAULT_TEMPLATES } from '../../lib/helpers/contestTemplates';
```

**ADD/KEEP:**
```typescript
import type { ContestConfigItem } from '../../contexts/contest/contestTypes';
```

2. **Add state for configs (after line 33):**
```typescript
const [configs, setConfigs] = useState<ContestConfigItem[]>([]);
const [configsLoading, setConfigsLoading] = useState(true);
const [configsError, setConfigsError] = useState<string | null>(null);
```

3. **Add useEffect to fetch configs (after line 47, after existing useState declarations):**
```typescript
useEffect(() => {
  async function fetchConfigs() {
    try {
      const response = await fetch('/api/contest/configs');
      if (!response.ok) {
        throw new Error('Failed to load configs');
      }
      const data = await response.json();
      setConfigs(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0].id); // Select first config by default
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configs';
      setConfigsError(message);
    } finally {
      setConfigsLoading(false);
    }
  }

  fetchConfigs();
}, []);
```

4. **Update template dropdown (find the select element, around lines 189-205):**

**OLD CODE:**
```typescript
<select id="contest-template" className="admin-rounds-select" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
  {templateKeys.map((key) => (
    <option key={key} value={key}>
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </option>
  ))}
</select>
```

**NEW CODE:**
```typescript
<select
  id="contest-template"
  className="admin-rounds-select"
  value={selectedTemplate}
  onChange={(e) => setSelectedTemplate(e.target.value)}
  disabled={configsLoading}
>
  {configs.map((config) => (
    <option key={config.id} value={config.id}>
      {config.topic}
    </option>
  ))}
</select>
{configsLoading && <span className="admin-detail-meta">Loading configs...</span>}
{configsError && <p className="error-message">{configsError}</p>}
```

5. **Update config preview (around line 138):**

**OLD CODE:**
```typescript
const selectedConfig: ContestConfig | undefined = DEFAULT_TEMPLATES[selectedTemplate];
```

**NEW CODE:**
```typescript
const selectedConfig: ContestConfig | undefined = configs.find(c => c.id === selectedTemplate);
```

6. **Update form submission (around lines 97-98):**

**OLD CODE:**
```typescript
payload.configTemplate = selectedTemplate;
```

**NEW CODE:**
```typescript
payload.configId = selectedTemplate;
```

7. **Remove obsolete code (line 33):**
```typescript
// DELETE: const templateKeys = getTemplateKeys();
```

**Testing:**
- Open ContestSetupForm, verify dropdown shows all 4 configs
- Verify loading state appears briefly
- Select each config and verify preview shows correct attributes
- Create contest with each config type
- Test error handling: simulate network failure, verify error message displays
- Verify submit button is disabled while loading

---

## Phase 4: Remove Fallbacks from Shared Utilities (2-3 hours)

### Task 4.1: Update scoreUtils.ts to Remove DEFAULT_CONFIG

**File to modify:** `src/features/contest/lib/helpers/scoreUtils.ts`

**Changes:**

1. **Remove import (line 2):**
```typescript
// DELETE: import { DEFAULT_CONFIG } from './contestTemplates';
```

2. **Remove module-level constant (line 5):**
```typescript
// DELETE: export const breakdownKeys: string[] = getAttributeIds(DEFAULT_CONFIG);
```

3. **Update `isBreakdownKey()` function to require config:**

**OLD:**
```typescript
export function isBreakdownKey(value: string): boolean {
  return breakdownKeys.includes(value);
}
```

**NEW:**
```typescript
export function isBreakdownKey(value: string, config: ContestConfig): boolean {
  const validKeys = getAttributeIds(config);
  return validKeys.includes(value);
}
```

4. **Update `buildFullBreakdown()` to require config:**

**OLD:**
```typescript
export function buildFullBreakdown(values: Partial<ScoreBreakdown>): ScoreBreakdown {
  const keys = getAttributeIds(config || DEFAULT_CONFIG); // or similar
  return keys.reduce<ScoreBreakdown>((acc, key) => {
    const value = values[key];
    acc[key] = value === null ? null : value ?? 0;
    return acc;
  }, {});
}
```

**NEW:**
```typescript
export function buildFullBreakdown(
  values: Partial<ScoreBreakdown>,
  config: ContestConfig // Make required
): ScoreBreakdown {
  const keys = getAttributeIds(config);
  return keys.reduce<ScoreBreakdown>((acc, key) => {
    const value = values[key];
    acc[key] = value === null ? null : value ?? 0;
    return acc;
  }, {});
}
```

5. **Keep `calculateScore()` with optional config (for backward compatibility):**

```typescript
export function calculateScore(breakdown: ScoreBreakdown, config?: ContestConfig): number {
  if (typeof breakdown.overall === 'number' && breakdown.overall > 0) {
    return breakdown.overall;
  }

  const keys = config ? getAttributeIds(config) : Object.keys(breakdown);
  const scores = keys
    .map((key) => breakdown[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}
```

**Warning:** This is a breaking change for `isBreakdownKey()` and `buildFullBreakdown()`. All call sites must be updated (Phase 5).

---

### Task 4.2: Update validation.ts to Remove DEFAULT_CONFIG

**File to modify:** `src/features/contest/lib/helpers/validation.ts`

**Changes:**

1. **Remove import (line 6):**
```typescript
// DELETE: import { DEFAULT_CONFIG } from './contestTemplates';
```

2. **Update `getEffectiveConfig()` function:**

**OLD:**
```typescript
export function getEffectiveConfig(contest: { config?: ContestConfig }): ContestConfig {
  return contest.config ?? DEFAULT_CONFIG;
}
```

**NEW:**
```typescript
export function getEffectiveConfig(contest: { config?: ContestConfig }): ContestConfig {
  if (!contest.config) {
    throw new Error('Contest is missing required config');
  }
  return contest.config;
}
```

**Design decision:** Throw error if config is missing. This ensures all contests have embedded configs. Old contests should already have configs via the embedded pattern.

---

## Phase 5: Update All Call Sites (4-6 hours)

### Task 5.1: Find All scoreUtils Function Call Sites

Run these commands to find where functions are used:

```bash
# Find isBreakdownKey calls
grep -r "isBreakdownKey" --include="*.ts" --include="*.tsx" src/

# Find buildFullBreakdown calls
grep -r "buildFullBreakdown" --include="*.ts" --include="*.tsx" src/

# Find getEffectiveConfig calls
grep -r "getEffectiveConfig" --include="*.ts" --include="*.tsx" src/
```

### Task 5.2: Update Each Call Site

**Pattern for isBreakdownKey updates:**

**OLD:**
```typescript
if (isBreakdownKey(someValue)) { ... }
```

**NEW:**
```typescript
if (isBreakdownKey(someValue, contest.config!)) { ... }
```

**Pattern for buildFullBreakdown updates:**

**OLD:**
```typescript
const breakdown = buildFullBreakdown(values);
```

**NEW:**
```typescript
const breakdown = buildFullBreakdown(values, contest.config);
```

**Use TypeScript compiler as checklist:**
- After making config required, TypeScript will show errors at all call sites that need updating
- Use IDE's "Find All References" to systematically update each one

**Error handling:**
- Add null checks where config might be undefined
- Use `contest.config!` (non-null assertion) where you're confident config exists
- Add runtime checks where appropriate

---

## Phase 6: Testing (4-6 hours)

### Task 6.1: Manual Testing Checklist

- [ ] **Seeding verification:**
  - Clear configs collection in Firestore manually
  - Restart app
  - Check Firestore console - verify 4 configs exist with correct IDs (mixology, chili, cosplay, dance)
  - Check browser console for seeding success log message
  - Restart app again - verify seeding is skipped (no duplicate creation)

- [ ] **Frontend form testing:**
  - Open ContestSetupForm
  - Verify dropdown is disabled while loading
  - Verify all 4 configs appear in dropdown
  - Select each config and verify preview updates with correct attributes
  - Verify entry label overrides still work (if applicable)

- [ ] **Contest creation:**
  - Create contest with each config type (mixology, chili, cosplay, dance)
  - Verify created contest stores full embedded config
  - Check Firestore to confirm config is embedded

- [ ] **Score calculations:**
  - Load an existing contest with entries
  - Submit scores for an entry using all attributes
  - Verify scores calculate correctly using contest.config
  - Test edge cases: missing attributes, N/A sections, overall score

- [ ] **Error handling:**
  - Test frontend: simulate network error (DevTools), verify error message displays
  - Test backend: try creating contest with invalid configId, verify error response
  - Test: delete a config from Firestore, try to create contest with that configId
  - Verify error messages are clear and helpful

### Task 6.2: Automated Testing

**Add/update tests:**
- [ ] Unit test for `seedDefaultConfigs()` function (idempotency, error handling)
- [ ] Unit test for `getConfig()` adapter method (found, not found, Firebase null)
- [ ] Integration test for contest creation with configId
- [ ] Update scoreUtils tests to pass required config parameter
- [ ] Update validation tests to expect error on missing config
- [ ] Verify no tests reference `DEFAULT_CONFIG` or `contestTemplates`

**Run test suite:**
```bash
npm test
```

---

## Phase 7: Cleanup and Finalization (1-2 hours)

### Task 7.1: Delete contestTemplates.ts

**Only do this AFTER all previous phases are complete and tested in production.**

1. **Verify no remaining imports:**
```bash
grep -r "contestTemplates" --include="*.ts" --include="*.tsx" src/
# Should return zero results (except comments/docs)
```

2. **Delete file:**
```bash
rm src/features/contest/lib/helpers/contestTemplates.ts
```

3. **Commit deletion:**
```bash
git add src/features/contest/lib/helpers/contestTemplates.ts
git commit -m "Remove deprecated contestTemplates.ts"
```

### Task 7.2: Update Documentation

- [ ] Update README with new config management approach
- [ ] Document the auto-seeding mechanism
- [ ] Add examples for creating custom configs via API
- [ ] Update API documentation to reflect required `configId` parameter
- [ ] Document error handling for missing configs

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code changes implemented and committed
- [ ] All automated tests passing
- [ ] Manual testing completed on all config types
- [ ] Error handling verified
- [ ] Performance tested (seeding doesn't slow startup significantly)

### Deployment Order (CRITICAL)
1. **Deploy Phase 1** (Seeding) alone - low risk, backward compatible ✅
2. **Deploy Phase 2 + 3 together** - breaking change, must be simultaneous ⚠️
3. **Deploy Phase 4-5** (Utilities) - internal refactoring, can be independent
4. **Test in production** - verify all functionality works
5. **Deploy Phase 7** (Cleanup) - remove old code after validation

### Rollback Plan (if Phase 2+3 fails)
- Revert backend to accept `configTemplate` parameter
- Keep seeding logic (harmless)
- Revert frontend to use old form
- Keep Config API (useful for future)

---

## Error Messages to Implement

**Backend errors:**
```
"Config not found: {configId}"
"Contest is missing required config"
"Failed to seed default configs: {error}"
```

**Frontend errors:**
```
"Failed to load configs"
"Loading configs..."
"Unable to create contest: Invalid config ID"
```

---

## Key Files Reference

**Files to create:**
- `src/features/contest/lib/firebase/seedDefaultConfigs.ts`

**Files to modify:**
- `src/features/contest/lib/firebase/firebaseBackendProvider.ts`
- `src/features/contest/lib/firebase/firestoreAdapter.ts`
- `src/features/contest/lib/firebase/providers/contestsProvider.ts`
- `src/features/contest/components/admin/ContestSetupForm.tsx`
- `src/features/contest/lib/helpers/scoreUtils.ts`
- `src/features/contest/lib/helpers/validation.ts`

**File to delete (Phase 7 only):**
- `src/features/contest/lib/helpers/contestTemplates.ts`

---

## Timeline Summary

| Phase | Duration | Risk | Notes |
|-------|----------|------|-------|
| 1 - Seeding | 2-3h | Low | Deploy independently |
| 2 - Backend | 2-3h | Medium | Deploy with Phase 3 |
| 3 - Frontend | 3-4h | Medium | Deploy with Phase 2 |
| 4 - Utilities | 2-3h | High | Many dependencies |
| 5 - Call Sites | 4-6h | High | TypeScript compiler helps |
| 6 - Testing | 4-6h | Medium | Thorough manual testing critical |
| 7 - Cleanup | 1-2h | Low | Final step only |

**Critical Path:** Phases 1 → (2+3 together) → 4-5 → 6 → 7

**Total: 18-27 hours** over 2.5-3.5 days

---

## Usage Tips

- Invoke this skill at any phase: `/migrate-to-config-api 1` for Phase 1 guidance
- Reference this skill during implementation for step-by-step instructions
- Use the file paths as your implementation checklist
- Run suggested bash commands to find and verify changes
- Update the plan's todo list as you complete each phase

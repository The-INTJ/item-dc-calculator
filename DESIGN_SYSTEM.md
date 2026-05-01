# Contest Design System

This document is a design handoff for Claude Design. It describes the current
contest app UI, the design primitives already in the repo, and the places where
the implementation is not yet up to a clean design-system spec.

The contest app is the active product area. The legacy DC calculator should stay
out of scope unless a follow-up task explicitly targets it.

## Scope

Active surfaces:

- `/contests`: authenticated and signed-out contest landing, contest list, and featured contest view.
- `/contest/[id]`: live contest page with round navigation, voting entry point, contestant registration CTA, and role state.
- `/contest/[id]/display`: venue/display mode bracket view.
- `/onboard`: guest and Google onboarding.
- `/account`: session/account state.
- `/admin`: admin dashboard, contest management, participants, rounds, entries, and activation.
- `/admin/contest-setup`: contest creation and config setup.

Implementation source of truth:

- `src/features/contest/styles/`: contest tokens, mixins, and feature styles.
- `app/styles/_site-shell.scss`: shared shell/header styling.
- `app/styles/_contest-landing.scss`: landing, global buttons, and contest card styling.
- `src/components/layout/`: shared shell navigation components.
- `src/features/contest/components/`: contest UI components.
- `app/(contest)/`: route group layout and route-level pages.

## Product Direction

The app has three different design jobs:

- Voters need a quick, clear scoring experience that feels lightweight and confident.
- Admins need a dense operational console for repeated contest setup and live event management.
- Display mode needs large, high-contrast, room-readable information for a venue screen.

The current visual language leans toward a dark slate and cyan "event tech"
palette, with amber used as a special accent. That direction is viable, but it
needs stronger semantic tokens and component rules before more screens are built.

## Design Principles

- Contest-first: design around live contest workflows, not a generic marketing page.
- Operational clarity: admin views should prioritize scanning, comparison, and repeated action.
- Fast voting: scoring should reduce friction and make submit state obvious.
- Broadcast legibility: display mode can be more dramatic, but must remain readable from a distance.
- Token-first implementation: future CSS should use contest tokens, semantic roles, and shared component classes rather than one-off values.
- Route stability: design work should not imply route, auth, provider, or data-path migrations.

## Foundations

### Color

Current primitive tokens live in `src/features/contest/styles/tokens/_colors.scss`.

| Role | Current token/value | Current use |
| --- | --- | --- |
| Primary | `$color-primary: #22d3ee` | Focus rings, selected borders, cyan accents |
| Primary hover | `$color-primary-hover: #06b6d4` | Active round text and hover accents |
| Dark 950 | `$color-dark-950: #0f172a` | Body text alias, app shell, dark CTAs |
| Dark 900 | `$color-dark-900: #1e293b` | Admin sidebar cards, hover state |
| Dark 800 | `$color-dark-800: #334155` | Admin header gradient |
| Surface | `$color-surface: #ffffff` | Cards and forms |
| Surface hover | `$color-surface-hover: #f1f5f9` | Light hover state |
| Border | `$color-border: #e2e8f0` | Light surface borders |
| Info | `$color-info-600: #2563eb` | Admin selected/role states |
| Success | `$color-success-500/#059669` | Round and voting success |
| Warning | `$color-warning-700: #d97706` | "Special" text, contestant roles |
| Error | `$color-error-*` | Error surfaces and danger actions |

Current semantic aliases:

- `$color-text-dark` maps to dark slate.
- `$color-text-light` maps to white/off-white.
- `$color-text-link` maps to cyan.
- `$color-text-special` maps to amber.
- Legacy aliases for primary/secondary/muted/tertiary all collapse into the four values above.

Spec gaps:

- Semantic maps in `src/styles/system/semantic/_core.scss` and `src/features/contest/styles/semantic/_mixology.scss` are placeholders.
- Text roles are too coarse. Muted, secondary, danger, success, link, and special all need separate semantic roles.
- Amber is currently used for many meanings: special emphasis, errors, success messages, and contestant role accents.
- Several styles still hard-code colors, especially gradients, alpha borders, dark panels, and admin selected states.
- Phase colors exist, but app shell phase styles use CSS custom property fallbacks instead of the tokens.

Design ask:

- Define a semantic color model for text, surface, border, action, status, role, and live-display use.
- Keep cyan/dark slate as the likely brand base, but reduce the current one-note dark/cyan/amber dependency.
- Decide whether display mode gets its own semantic sub-theme or a documented "broadcast" mode.

### Typography

Current tokens live in `src/features/contest/styles/tokens/_typography.scss`.

| Token | Current value |
| --- | --- |
| `$font-family-sans` | System stack with Segoe UI, Roboto, Helvetica, Arial |
| `$font-family-mono` | Menlo, Monaco, Consolas, Liberation Mono, Courier New |
| `$font-size-small` | `0.75rem` |
| `$font-size-normal` | `1rem` |
| `$font-size-large` | `clamp(1.2rem, 1rem + 0.8vw, 1.75rem)` |
| `$font-size-massive` | `clamp(2.25rem, 1.65rem + 2.5vw, 4.5rem)` |
| Weights | 400, 600, 700 |
| Line heights | 1, 1.4, 1.6 |

Current mixins include `type-small`, `type-normal`, `type-large`, `type-massive`,
`type-label`, and compatibility aliases like `type-xs`, `type-md`, and `type-xl`.

Spec gaps:

- The scale is too sparse for admin density. Many compact admin controls use normal-size text because no clear small/body/heading ladder exists.
- `$font-size-large` is used for nav links and buttons, which makes some utility UI feel oversized.
- `$font-size-massive` is used in cards and list headers where a page-level display size is not always appropriate.
- Letter spacing tokens exist and labels use uppercase tracking, but there is not a documented rule for when tracked uppercase is allowed.
- Material Symbols are referenced in `VoteModal`, but no font import is present in the contest app.

Design ask:

- Define a type ladder for label, helper, body, body-strong, section heading, page heading, and display.
- Provide separate type guidance for admin console density and venue display mode.
- Decide whether labels stay uppercase/tracked or move to sentence case.

### Spacing

Current spacing tokens live in `src/features/contest/styles/tokens/_spacing.scss`.

The scale includes:

- 4px: `$space-xs`
- About 5px: `$space-2xs`
- About 5.6px: `$space-sm`
- About 6.4px: `$space-md`
- 8px: `$space-base`
- 12px: `$space-lg`
- About 14.4px: `$space-xl`
- About 15.2px: `$space-2xl`
- 16px: `$space-3xl`
- 24px: `$space-4xl`
- 32px: `$space-5xl`

Semantic aliases exist for gaps and padding.

Spec gaps:

- The scale has several near-duplicates around 5px to 16px.
- Some styles still use literal values such as `0.15rem`, `0.25rem`, `0.6rem`, `1.25rem`, and `2rem`.
- Layout widths and gutters are not defined; `src/features/contest/styles/tokens/_layout.scss` is a TODO placeholder.
- Page max widths are scattered across account, auth, featured contest, and admin surfaces.

Design ask:

- Normalize to a smaller spacing scale with named layout gutters and content widths.
- Define page, panel, card, form, and list density rules.

### Radius

Current radius tokens live in `src/features/contest/styles/tokens/_radii.scss`.

| Token | Value |
| --- | --- |
| `$radius-xs` | 4px |
| `$radius-sm` | 8px |
| `$radius-md` | 10px |
| `$radius-lg` | 12px |
| `$radius-xl` | 16px |
| `$radius-full` | 999px |

Semantic aliases:

- Button: 8px
- Card: 12px
- Modal: 16px
- Pill: 999px

Spec gaps:

- Cards vary between 8px, 10px, 12px, 14px, and 16px.
- Pills are common for nav links, status, and badges, but not always semantically distinct.
- Modal and card rounding feel more decorative than the admin console needs.

Design ask:

- Define one default radius for operational cards and controls.
- Reserve pill radius for badges, chips, and segmented controls only.

### Elevation

Current shadow tokens live in `src/features/contest/styles/tokens/_shadows.scss`.

The repo has tokenized small through modal shadows, but many surfaces use
custom shadows directly, especially landing heroes, contest cards, active rounds,
and display mode.

Spec gaps:

- Elevation does not map to surface hierarchy.
- Some interactive hover states change both transform and shadow in ways that may feel jumpy.
- Dark-mode shadows are not separately specified.

Design ask:

- Define elevation levels by use: resting card, active/selected card, modal, display highlight.
- Define hover movement rules for admin, voter, and display surfaces.

### Motion

Current motion tokens live in `src/features/contest/styles/tokens/_motion.scss`.

| Token | Value |
| --- | --- |
| Fast | 150ms |
| Base | 200ms |
| Slow | 300ms |
| Easing | `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear` |

Spec gaps:

- Display mode has infinite pulse animations without a reduced-motion fallback.
- Hover transforms are not consistently paired with focus-visible states.
- No motion guidance exists for live data updates, score changes, or bracket advancement.

Design ask:

- Define reduced-motion behavior.
- Define live contest transitions: score updated, vote submitted, round advanced, matchup active.

### Layout

Current breakpoints live in `src/features/contest/styles/tokens/_breakpoints.scss`.

- Small: 640px
- Medium: 768px
- Large: 900px

Spec gaps:

- Layout token map is empty.
- Z-index token map is empty, while modal backdrop uses 1000 and admin sticky toggle uses 10.
- Display mode uses horizontal overflow and CSS variables for bracket columns; this needs explicit responsive behavior.
- The shell header is shared but visually tied to contest tokens.

Design ask:

- Define route-level layout templates: landing, detail, admin two-column, modal, broadcast display.
- Define container widths and gutters for mobile, tablet, desktop, and wide display.
- Define z-index layers for shell, sticky controls, modal, overlay, tooltip, and display effects.

## Components And Patterns

### App Shell

Current implementation:

- `SiteHeader` renders a dark shell header except on display mode.
- Navigation currently includes Account and admin-only Admin.
- Header home link uses a CSS module, while nav and banner use global classes.
- Signed-out contest routes show an auth banner.

Spec gaps:

- Header brand/home affordance is just "Home"; the product identity is weak.
- Nav links are styled as large pills, which can feel heavy for utility navigation.
- App shell uses contest tokens even though it lives in `app/styles`.
- Header class `.site-header__brand` exists in CSS but is not currently used.

Design ask:

- Define shell variants: normal contest app, admin, onboarding, and hidden display mode.
- Decide whether navigation should be compact utility nav or prominent pills.

### Buttons And Actions

Current implementation:

- `.button-primary` and `.button-secondary` are global classes defined in `app/styles/_contest-landing.scss`.
- Buttons are reused across auth, admin, landing, account, and vote actions.
- Additional button systems exist: `.contest-rounds__vote-cta`, `.contestant-cta__button`, `.admin-inline-button`, `.admin-phase-button`, MUI `IconButton`, and link CTAs in CSS modules.

Spec gaps:

- Primary action styling changes by surface: dark button, amber featured-card CTA, gradient vote CTA, blue admin inline primary.
- Secondary action styling assumes a dark hero background, then gets overridden inside guest flows.
- Disabled states are incomplete and inconsistent.
- Some buttons have focus-visible styles; others only style `:focus` or do not style focus.
- Icon usage is not standardized.

Design ask:

- Define button variants: primary, secondary, tertiary, danger, inline, icon, segmented, and broadcast CTA.
- Define button sizes: compact, default, large, display.
- Define link-vs-button rules and disabled/loading states.

### Cards And Surfaces

Current implementation:

- `card-surface` gives white background, border, 12px radius, and 16px padding.
- `.contest-card` is a dark radial-gradient card used by entry cards.
- Home CSS modules use light card surfaces.
- Admin uses dark sidebar cards and light main-detail cards.
- Display mode uses dark translucent panels.

Spec gaps:

- `.contest-card` name is generic but visually specific to a dark event card.
- Light and dark surfaces do not share a semantic naming model.
- Card density varies widely across landing, home, round, admin, and display mode.
- Nested card-like surfaces appear in admin and display views.

Design ask:

- Define surface roles: page, panel, card, list row, selected row, elevated modal, broadcast panel.
- Define dark and light surface recipes separately.

### Forms

Current implementation:

- Auth forms use `.auth-field` and `input-base`.
- Admin inputs use `.admin-rounds-input`, `.admin-contestant-input`, and select variants.
- Contestant registration uses `.contestant-cta__input`.
- Vote scoring uses MUI `Slider`.

Spec gaps:

- Inputs are duplicated across auth, admin, and contest CTA.
- MUI components are not themed to the contest tokens.
- Validation, helper text, placeholder, disabled, and loading states are not standardized.
- Inline styles exist in admin components for spacing.

Design ask:

- Define form field anatomy: label, helper, input, select, textarea, error, warning, success.
- Define slider styling for scoring and whether MUI remains the implementation base.
- Define compact admin form layout rules.

### Tabs, Segmented Controls, And Round Navigation

Current implementation:

- Contest round navigator uses horizontal scroll tabs and a hero panel.
- Vote category tabs use pill buttons.
- Config setup mode toggle uses `.button-secondary--active`.
- Admin phase controls use large card-like buttons.

Spec gaps:

- Similar selection patterns have unrelated styling.
- Vote category tabs use `role="tab"` plus `aria-pressed`, but do not implement the same keyboard model as round tabs.
- Segmented controls and tabs do not have a documented active/focus/disabled spec.

Design ask:

- Define when to use tabs, segmented controls, choice cards, and filter chips.
- Define active, viewed, disabled, and unavailable states.

### Badges And Status

Current implementation:

- `status-badge` provides uppercase, small, bold, compact pills/chips.
- Role badges include admin, voter, competitor, and contestant.
- Round badges include set, shake, scored, active, closed, upcoming.
- Display status badges include active, closed, and upcoming.

Spec gaps:

- Status colors are similar but not semantically centralized.
- "Set", "Shake", and "Scored" are domain-specific states that need design labels alongside technical labels.
- Text contrast should be checked for amber, gray, and cyan combinations.

Design ask:

- Define status taxonomy and color mapping for contest phase, round state, matchup phase, role, vote status, and system feedback.
- Provide user-facing labels for technical states.

### Modals

Current implementation:

- Auth and confirm modals use custom `.auth-modal` and `.auth-modal-backdrop`.
- Vote modal uses MUI `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, and `IconButton`.

Spec gaps:

- There are two modal systems.
- MUI vote modal does not inherit the custom modal token recipe.
- Close icon relies on Material Symbols without a documented font dependency.
- Modal widths, padding, titles, and actions need one shared spec.

Design ask:

- Pick one modal design contract, even if implementation temporarily uses both custom CSS and MUI.
- Define small confirmation, form modal, voting modal, and full-screen mobile behavior.

### Voting Experience

Current implementation:

- Vote modal presents entries as cards and categories as sliders.
- Submit state appears below the submit button.
- Round hero exposes a "Vote this round" CTA only when active.

Spec gaps:

- Entry cards inherit dark contest-card styling, while sliders live in a MUI light/default style context.
- Scoring defaults to 5, but visual copy does not explain scale endpoints.
- Submit success and error both use the special amber text color.
- Empty states are text-only.

Design ask:

- Define voting card layout, score scale labels, slider marks, submit state, and completed-vote state.
- Decide whether voting should be a modal, page, or responsive sheet on mobile.

### Admin Experience

Current implementation:

- Admin dashboard has a dark sidebar and light main panel.
- Contest cards, detail sections, participant accordions, entry rows, config forms, phase controls, and round state controls are all custom global CSS.

Spec gaps:

- Admin is denser and more operational than the rest of the app, but still uses oversized type in places.
- Forms and controls have many local class families instead of shared field/action primitives.
- Sidebar collapse behavior and sticky controls need a responsive design spec.
- Empty, loading, error, and permission-denied states are not visually unified.

Design ask:

- Treat admin as an operational dashboard, not a marketing surface.
- Define data-dense list rows, accordions, control groups, destructive actions, and live event controls.
- Provide mobile and desktop states for the sidebar/detail layout.

### Display Mode

Current implementation:

- Display mode hides the shell and fills the viewport.
- It uses dark radial backgrounds, translucent panels, large type, bracket columns, SVG connector overlays, and pulse animation for active matchups.

Spec gaps:

- Display mode is visually separate from the rest of the design system, which may be correct but needs formalized tokens.
- Horizontal overflow behavior needs design validation for different bracket sizes.
- Infinite pulse animation needs reduced-motion and "not too distracting" guidance.
- Score, leader, up-next, and current matchup hierarchy should be checked from room distance.

Design ask:

- Define a broadcast sub-theme with typography, panel, animation, and spacing rules.
- Provide examples for 2, 4, 8, and 16 contestant brackets if possible.

### Account And Onboarding

Current implementation:

- Onboarding is guest-first with optional Google sign-in.
- Account page exposes current session status and raw session data.

Spec gaps:

- Account page reads as a debug utility rather than a user-facing profile.
- Onboarding form is centered and compact, but does not share a polished auth card surface.
- Guest-vs-Google choice hierarchy needs product design.

Design ask:

- Define onboarding as a clear gateway into contests.
- Decide what account information should remain visible to end users vs. admin/debug only.

## Design Debt Inventory

Use this as the prioritized cleanup map after Claude Design returns designs.

1. Semantic tokens are missing or empty.
   - `src/styles/system/semantic/_core.scss`
   - `src/features/contest/styles/semantic/_mixology.scss`
   - `src/features/contest/styles/tokens/_layout.scss`
   - `src/features/contest/styles/tokens/_zindex.scss`

2. The button system is global and inconsistent.
   - Base buttons live in `app/styles/_contest-landing.scss`.
   - Admin, voting, contestant CTA, and featured-card CTA define additional button recipes.

3. MUI is unthemed and mixed with custom CSS.
   - `VoteModal` and `VoteScorePanel` use MUI `Dialog`, `IconButton`, and `Slider`.
   - No contest `ThemeProvider` or MUI token bridge exists.

4. Text color semantics are too compressed.
   - Secondary and muted text currently collapse to dark text with opacity.
   - `$color-text-special` is used for too many meanings.

5. Layout and z-index systems are placeholders.
   - Modal backdrop uses hard-coded `z-index: 1000`.
   - Admin sticky toggle uses hard-coded `z-index: 10`.
   - Route-level widths and gutters are scattered.

6. Radius and elevation drift.
   - Current card-like surfaces range from 8px through 16px.
   - Shadows are partly tokenized and partly custom.

7. Accessibility states need standardization.
   - Focus styles vary by component.
   - Reduced-motion handling is missing for display pulse effects.
   - Tab/segmented-control semantics are inconsistent.

8. Iconography is not established.
   - Material Symbols are referenced but not documented or imported.
   - Admin controls mostly use text, arrows, or glyphs rather than a consistent icon set.

9. Empty/loading/error states are thin.
   - Most states are plain text blocks or minimally styled panels.
   - Admin and voter states need clearer hierarchy and recovery actions.

10. The app-shell styling is coupled to contest implementation details.
    - `app/styles/_site-shell.scss` imports contest tokens.
    - This is acceptable today because contest is active, but should be documented as intentional or moved to shared system tokens later.

## Claude Design Deliverables Requested

Please produce:

- A token proposal for color, typography, spacing, radius, elevation, motion, layout, and z-index.
- Component specs for shell, buttons, cards, forms, tabs, badges, modals, vote controls, admin tables/lists, and display bracket panels.
- Route-level responsive designs for `/contests`, `/contest/[id]`, `/contest/[id]/display`, `/onboard`, `/account`, `/admin`, and `/admin/contest-setup`.
- State specs for loading, empty, error, disabled, focus, hover, selected, active, closed, upcoming, pending, success, danger, and reduced-motion.
- A migration note that maps proposed components back to current class families and files.

Non-goals:

- Do not redesign or refactor the legacy DC calculator.
- Do not change contest data paths, API/provider architecture, auth flow, or route structure.
- Do not assume browser CRUD should move to route handlers as part of design cleanup.

## Suggested Implementation Path After Designs Return

1. Update tokens first in `src/features/contest/styles/tokens/` and semantic maps.
2. Move global action recipes out of landing-specific styles into contest component styles or shared UI styles.
3. Create a small component style contract for actions, surfaces, forms, badges, and modals.
4. Bridge or replace MUI defaults for voting modal and sliders.
5. Apply route-by-route visual updates, starting with `/contests` and `/contest/[id]`, then admin, then display mode.
6. Keep visual QA tied to the required repo checks in `AGENTS.md`.


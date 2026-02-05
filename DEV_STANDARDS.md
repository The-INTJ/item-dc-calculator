# Dev Standards

This document defines the development standards for this codebase.  
It applies to both the new Contest Rating app and the existing dc-calculator app.  
When instructed to “refactor according to the Dev Standards,” follow these rules.

---

## 1. Component Size and Structure

- React components should generally be **under ~80 lines of code**, not counting:
  - Imports
  - Simple type/interface declarations
- When a component starts to grow beyond this or becomes conceptually busy:
  - Extract helper functions into separate utility modules.
  - Extract reusable UI fragments into subcomponents.
  - Extract complex logic into custom hooks (`useXyz`).
- Prefer:
  - Small, focused, composable **presentational components**.
  - Hooks or container components for data fetching and business logic.
- Avoid deeply nested JSX. If nesting is complex, split into child components.

---

## 2. Styling, Colors, and Global Assets

- **No hardcoded colors** in frequently used styles:
  - Colors should come from:
    - The MUI theme palette, or
    - SCSS/SASS variables defined in a central place.
  - Avoid inline colors like `style={{ color: '#ff0000' }}` or raw hex in SCSS/JSX, except for rare, well-justified one-offs (and document those).
- We use a **global assets and styling structure**:
  - Use a folder such as `src/assets/` (or the existing convention) for:
    - Images
    - Non-Material icons
    - Global SCSS/SASS partials (variables, mixins, functions)
- We should **fully utilize SASS/SCSS**:
  - Variables for colors, spacing, font sizes, breakpoints.
  - Mixins for reusable patterns (e.g., media queries, flex helpers).
  - Functions for computed/derived values.
  - Partials + imports for modular, maintainable styling.
- Organize global SCSS:
  - A dedicated place for theme tokens and variables (e.g., `_tokens.scss` or `_variables.scss`).
  - Separate partials for mixins and functions.
  - Feature- or component-level SCSS should be as localized as possible while still using global tokens.

---

## 3. Theming and Dual-App Design (Contest vs DC Calculator)

- The app must support:
  - A **Contest theme** for the contest experience.
  - A distinct **DC-calculator theme** for the item DC experience.
- Requirements:
  - Components and pages must be **theme-aware**, not hardcoded to one visual style.
  - No theme-specific colors, typography, or spacing values should be hardcoded in components.
    - Use MUI theme tokens and/or SCSS variables instead.
- Implementation guidance:
  - Maintain separate theme definitions (e.g., `theme.contest.ts`, `theme.dc-calculator.ts`, or equivalent).
  - Use theme providers or layout wrappers to scope the Contest theme and the DC-calculator theme to the appropriate parts of the tree.
- When building or refactoring components:
  - Design them so they look correct under both themes, driven by theme values instead of fixed constants.

---

## 4. Component Library and Reuse

- Maintain a **shared component library** inside the app (for example, `src/components/lib/` or `src/ui/`):
  - Shared, reusable UI primitives and patterns belong here.
  - Prefer adding new generic UI elements to this library instead of re-creating ad-hoc components in pages.
- Guidelines:
  - Use clear, descriptive names (e.g., `AppButton`, `ScoreCard`, `ThemeSwitch`, etc.).
  - Promote UI into the library when:
    - It is used in more than one place, or
    - It is clearly generic and likely to be reused.
  - Components in the library should be:
    - Well-typed (TypeScript).
    - Theme-aware.
    - Documented via props and (where available) simple stories or examples.

---

## 5. MUI Usage and Material Symbols

- We **heavily utilize MUI** as the primary UI toolkit:
  - Prefer MUI components for buttons, cards, typography, layout, etc.
  - Align spacing, typography, and colors with the MUI theme.
- **Icons:**
  - Use the **new Material Symbols** approach, not the old direct SVG Material Icons imports.
  - If we wrap icons, do so via a small, reusable component (e.g., `AppIcon`) that:
    - Unifies size and style.
    - Reads color from theme tokens (not hardcoded).
- Avoid introducing multiple competing icon systems unless there is a strong justification and it is documented here.

---

## 6. Code Quality, Type Safety, and Architecture

- **TypeScript:**
  - All new modules and components should be written in TypeScript.
  - Use explicit prop types/interfaces for components.
  - Export types where reuse is expected.
- **File and folder structure:**
  - Follow a consistent structure:
    - `components/`, `features/`, `hooks/`, `lib/`, and Next.js `app/` or `pages/` as appropriate.
  - Group feature-specific logic and UI together in feature folders.
  - Keep shared logic in clearly named shared locations (`lib/`, `shared/`, etc.).
- **Hooks and logic extraction:**
  - Extract complex stateful or side-effect-heavy logic into custom hooks.
  - Keep presentational components as close to “render-only” as practical.
- **Accessibility:**
  - Ensure accessible semantics:
    - Use meaningful HTML elements and ARIA attributes when needed.
    - Ensure keyboard navigation works.
    - Maintain visible focus states (coming from theme, not ad-hoc colors).
- **Testing (where infrastructure exists):**
  - For shared components and critical logic, add or maintain basic tests (unit or component tests).
  - Align with the project’s existing testing tools and patterns.
- **React**
  - We are on React 19 with the React Compiler. Do not use "useMemo". They are no longer needed.

---

## 7. When to Apply These Standards

- Apply these standards when:
  - Creating new components, pages, or features.
  - Refactoring existing code at our direction (e.g., “refactor this feature according to the Dev Standards”).
- When making tradeoffs (e.g., performance vs. purity), document them in:
  - The relevant component/file, and/or
  - The appropriate project documentation (e.g., the Contest or Dev Standards READMEs).

---

## 8. Future Adjustments

- This Dev Standards document can evolve:
  - If you need to deviate from a standard for good reason, document the exception.
  - If a standard repeatedly gets in the way, propose a refinement here.

---
name: Execute CurrentPlan
description: Execute the next incomplete phase(s) from Plans/Plan.md, then update the plan to reflect progress.
---

## Directive

You are executing the plan defined in `Plans/Plan.md/CurrentPlan.md`. Read it now. Identify the next incomplete phase(s) and execute them.

## Core Rules

1. **Follow the plan exactly.** Do not invent work that isn't in the plan. Do not skip steps.
2. **Radically simple.** Every decision should favor the simplest possible outcome. Fewer files, fewer abstractions, fewer lines.
3. **Delete > Add.** If you have a choice between adding code and deleting code, delete. Your goal is to deliver a net-negative line count whenever possible.
4. **When encountering problems:** prefer deleting the problematic code or flagging it for the user over writing complex fixes. Never add many lines to work around an issue — simplify or remove instead.
5. **Do NOT touch DC calculator code.** Nothing in `src/features/dc-calculator/`, `app/(dc-calculator)/`, or any dc-calculator-specific files. Ever.
6. **Do NOT spend time on tests.** If tests block progress, delete them. Do not write new tests. Do not fix broken tests.
7. **Update the plan after every phase you complete:**
   - Mark completed items as done (checkbox `[x]` or strikethrough).
   - **Delete instructions, details, and context that are no longer relevant** so the plan gradually shrinks.
   - If a phase is fully done, collapse it to a single "✅ Completed" line.
   - If you discover something unexpected, add a brief note to the plan under the relevant phase.
   - The plan should always reflect the current true state of progress — a fresh reader should be able to pick it up and continue.
8. **Work incrementally.** Complete one phase (or a coherent subset), update the plan, then proceed to the next. Do not attempt all phases in one pass.
9. **Build verification.** After completing phases that change imports, paths, or types, run `npm run build` to verify. Fix type errors by simplifying, not by adding complexity.
10. **Stay focused on the plan.** Do not refactor unrelated code, improve style, or optimize things the plan doesn't mention. If something appears suboptimal but isn't in the plan, notify the user, especially if the net result is few lines and complexity added.
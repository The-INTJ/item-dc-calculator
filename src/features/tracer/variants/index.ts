/**
 * Game styles and rule sets: the code-defined catalogue of ways to play
 * Tracer, and the schema every rule set passes through. Pure — no React.
 */

export {
  DEFAULT_STYLE_ID,
  GAME_STYLES,
  ORIGINAL_V1,
  styleById,
  styleRef,
  TIERED_V2,
  type GameStyle,
  type StyleRef,
} from './profiles';
export { CLASSIC_LAYOUT, layoutById, LAYOUTS, SPACED_LAYOUT } from './layouts';
export { LayoutSchema, layoutProblems, MAX_TIERS, RuleSetSchema } from './rule-schema';

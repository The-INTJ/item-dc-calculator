/**
 * The two-stage generator — real suggestions around the user's surface.
 *
 * Stage A chooses chord paths: per melody event, the vocabulary chords that
 * contain the melody note and every pinned note; a beam search scores paths
 * with style-pack costs (chord prevalence, directed progressions, harmonic
 * rhythm, gapped-melody weighting, cadence-by-intent — intent RANKS, never
 * filters). Boundary constraints partition the lattice: `hold` forbids a
 * change, `required` forbids continuing. The approach seam seeds the opening
 * transition. Spans no chord satisfies become honest holes, exactly like the
 * naive layer — showing the gap is the point.
 *
 * Stage B voices each chosen path: soprano fixed to the melody, bass/tenor/
 * alto enumerated over hymnal ranges ∩ chord tones ∩ doubling options, then a
 * beam DP scores transitions by style-weighted voice-leading facts plus
 * smoothness (semitone motion, common tones), seeded against the approach
 * voices. Locked notes are fixed assignments. Everything is deterministic:
 * content-derived ids, total tie-breaks, no randomness — safe in the reducer.
 *
 * Split by concept: enumerate (vocabulary), path-steps (stage A types +
 * cadence/approach reads), generate-readings (stage A beam + ranking),
 * assignments / transition-cost / voicing-search (stage B), voicing-assembly
 * (SATB lanes), build-candidate (path → CandidatePath), derivability (notes).
 * This barrel is the public seam — internals stay out of it.
 */

export { ENGINE_GENERATOR_ID, ENGINE_GENERATOR_VERSION } from './build-candidate';
export { ENGINE_DERIVABILITY_NOTES, ENGINE_SKETCH_DERIVABILITY_NOTES } from './derivability';
export { enumerateChords } from './enumerate';
export type { DegreeMemberRef, EnumeratedChord } from './enumerate';
export type { LockedPitchConstraint } from './path-steps';
export { generateReadings } from './generate-readings';
export type { GenerationRequest } from './generate-readings';

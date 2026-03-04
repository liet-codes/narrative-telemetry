# Research Log — Narrative Telemetry

## Iteration 1: Revised Type System + Reducer + Fellowship Example
**Date:** 2026-03-03

### Hypothesis
The type system from DESIGN.md and EPISTEMICS.md can be implemented as a coherent TypeScript system that models narrative causation through absential dynamics, epistemic states, and dual temporality.

### Experiment
Implemented:
1. **Revised types** (`src/types.ts`): Entity registry, dual temporality, absentials with visibility/causation, full epistemic system (Facts, Lenses, Stances with apprehension modes, Justification DAGs), reader archetypes, epistemic events, epistemic gaps
2. **Revised reducer** (`src/reducer.ts`): Kind-specific absential reducers (10 kinds), epistemic event processing, latent absential activation, tension computation (RMS), retroactive insertion + replay with tension diffs
3. **13 passing tests** covering core reducer, tension, epistemics, gaps, retroactive insertion, kind-specific behavior
4. **Expanded Fellowship example** with 10 events, 5 characters, 3 reader archetypes, overdetermined causation, dramatic irony detection, tension curve, retroactive insertion

### Analysis
**What worked:**
- The tension curve produces a satisfying rising shape with clear inflection points (Gandalf's fall, Boromir's betrayal)
- Epistemic gap detection correctly identifies dramatic irony (Gandalf's return: re-reader knows, Frodo doesn't)
- Reader archetype divergence is visible and meaningful (naive vs genre-savvy vs re-reader)
- Retroactive insertion shows consistent uplift across all discourse positions — the "Gandalf as shield" insight reframes the entire narrative
- Overdetermined causation for Gandalf's fall captures 5 simultaneous frames (mechanical, intentional, structural, thematic, authorial)
- Latent absential activation works: knowledge triggers manifest visibility

**What's interesting:**
- Entropy kind's monotonic increase (with constant drift term +0.01) gives it a different character from other absentials
- The RMS tension computation naturally emphasizes high-pressure absentials without drowning in low ones
- The sparse lens representation (store only divergences) keeps the data manageable even with many knowers
- Apprehension modes matter: Frodo's "believed-false" about Gandalf's return is *traumatic* (high intensity, low volatility), not just epistemic

**Open questions:**
1. The gap classifier sometimes misclassifies when a knower has multiple stances (naive reader: suspected → known-true creates two active stances). Need stance supersession in gap detection.
2. Tension only goes up in this example. Need events that release tension (resolution, comic relief) to test the descending curve.
3. The relevance function (tag overlap) is still simplistic. Works for hand-tagged events but wouldn't scale.
4. Can we compute the Groovy Commutator over causal frames?

### Next steps
- Mystery story example (where epistemic gaps ARE the plot)
- Groovy Commutator over causal frames
- Narrative structure detection from tension dynamics

## Iteration 2: Mystery Example, Groovy Commutator, Structure Detection
**Date:** 2026-03-03

### Hypothesis
1. Mystery narratives will show a fundamentally different tension curve than epic narratives — rising to climax then dropping to zero on resolution
2. The Groovy Commutator can be computed over causal frames, and events with more overdetermined causation will show higher non-commutativity
3. Narrative structure (rising action, climax, falling action, resolution) can be detected automatically from tension dynamics

### Experiment
1. Built "The Locked Room" mystery example: 6 events, 4 characters, 2 reader archetypes
2. Implemented commutator computation with anchoring-bias-based framing effects
3. Implemented structure detection from tension curve derivatives and peaks

### Analysis
**What worked:**
- Mystery tension curve: classic arc shape. Tension starts HIGH (0.784) and rises to peak (0.924), then drops to ZERO when all secrets resolve. This contrasts sharply with Fellowship which only rises.
- Genre-savvy mystery reader correctly suspects the butler is innocent from event 1 (prior: "obvious suspect is never guilty"). Naive reader is fooled until the confession. This is exactly how mystery genre literacy works.
- Structure detector correctly identifies mystery as rise→climax→falling→resolution and Fellowship as continuous rising action.
- The Groovy Commutator reveals that mystery events have LOW non-commutativity (mechanics and structure are aligned) while epic events have HIGHER non-commutativity when comparing diegetic and authorial frames.

**Key insight on the Commutator:**
The highest non-commutativity appears between frames of DIFFERENT REGISTER: diegetic-mechanical × authorial (G=0.091 for Gandalf's fall). Frames in the same register (diegetic-mechanical × diegetic-intentional: G=0.000) commute perfectly. This makes sense: "physics did it" and "he chose it" are in the same ontological register; "physics did it" and "the author needed it" are in DIFFERENT registers and the ordering genuinely matters.

**Open questions:**
1. The commutator values are still modest (max 0.091). Need to explore whether this is a limitation of the formula or genuine — maybe narrative frames are more commutative than expected?
2. Can we create an event that has STRONG non-commutativity (G > 0.3)? What would that look like?
3. The mystery starts at high tension because secrets are established at event 0. Should "initial mystery pressure" be treated differently from built-up pressure?

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

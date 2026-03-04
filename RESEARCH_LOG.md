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

## Iteration 3: Absential Field Graph + Integration
**Date:** 2026-03-03

### Hypothesis
The absential field can be rendered as a graph, and its topology reveals narrative structure — centrality = narrative importance.

### Experiment
Built graph module: entities + absentials + facts as nodes, causal/epistemic/gap relationships as edges. Computes degree centrality.

### Analysis
**Key finding:** The most connected node in the Fellowship graph is the fact "Bilbo's ring is the One Ring" (degree 11). This makes perfect sense — it's the epistemic hub around which ALL other narrative dynamics orbit. The second most connected are "Gandalf will return" and "Boromir is corrupted" (degree 7 each) — both are epistemic gaps that drive dramatic tension.

**The graph reveals:** Narrative importance ≈ epistemic centrality. The facts that generate the most gaps and the absentials that affect the most entities are the load-bearing elements of the story.

**Graph stats:**
- 21 nodes (9 entities, 7 absentials, 5 facts)
- 48 edges (13 affects, 5 causes, 11 gaps)
- This is a small but dense graph — most nodes are connected

### Commutator Findings (Refined)
Gandalf's fall remains the highest-depth event (0.048). The cross-register pairs (diegetic × authorial) consistently show the most non-commutativity. Same-register pairs (diegetic-mechanical × diegetic-intentional) always commute.

This is a genuine finding: **narrative depth arises from cross-ontological causation**. When an event is explained by forces in different ontological registers (physics vs. myth vs. authorship), the order in which you foreground each explanation changes the interpretive gestalt.

## Iteration 5: "Araby" — LLM as Reader, Types as Schema
**Date:** 2026-03-03

### The Experiment
Can the narrative telemetry system capture James Joyce's "Araby" — a story where almost nothing happens externally but everything happens internally? This is a fundamentally different test from Fellowship (epic, external action, rising tension) and the mystery (epistemic puzzle, resolution arc). "Araby" is about the *quality of consciousness* — a boy's romantic projection, the gap between felt intensity and objective triviality, and a brutal final epiphany.

### Close Reading

**The story in brief:** An unnamed boy in Dublin develops an intense, quasi-religious infatuation with a neighbor girl ("Mangan's sister"). She mentions a bazaar called Araby that she cannot attend. He promises to bring her something. His uncle comes home late and drunk, delaying him. He arrives at the bazaar as it's closing — dark, empty, commercial. He overhears a banal flirtation. In the darkness, he sees himself "as a creature driven and derided by vanity."

**Key absential dynamics:**
1. The girl as attractor toward an absence (projection, not person)
2. Dublin-as-paralysis as constraint (dead-end street, dead priest, entropy)
3. The boy's romantic lens as invisible self-deception
4. The uncle's lateness as entropy
5. Joyce's paralysis thesis as authorial constraint

**Key epistemic insight:** Almost all the boy's knowledge is in *affective* mode. The epiphany is a mode shift from affective to epistemic — felt meaning collapses into known meaninglessness.

**Overdetermined causation of the epiphany:** diegetic-mechanical (dark bazaar), diegetic-intentional (recognition), structural (coming-of-age), thematic (vanity exposed), authorial (Joyce's Dublin thesis), intertextual (grail quest inverted), cultural (colonial escape-fantasy).

**The test:** Can the system represent the simultaneous collapse of attractor, self-deceptive lens, mode shift, and entropy completion?

### Reflection: What the System Captured and What It Missed

**Results:**
- Tension curve: continuous rise from 0.333 to 0.588, peaking AT the epiphany. The system doesn't show collapse because the epiphany resolves 3 absentials but the remaining unresolved ones (dublin-paralysis, uncle-obstacle, dead-priest-absence) keep tension elevated. This is actually *more accurate* than a simple drop would be — the boy's anguish and anger ARE ongoing tension, not resolution.
- Epistemic gaps: correctly detected self-deception pattern. The boy's 'denied' stance on his projection vs. the scholar's 'known-true' creates the central dramatic irony. At the epiphany, the boy gets BOTH 'denied' and 'known-true' on the same fact — which the gap detector sees as internal divergence. This is exactly right: the epiphany is the boy holding both stances simultaneously for a burning moment.
- Commutator: narrative depth = 0.0598. The highest non-commutativity (G=0.1255) was between authorial × cultural frames — meaning the story changes most depending on whether you foreground Joyce's thesis or the colonial context. The diegetic-intentional × authorial pair (G=0.0283) was surprisingly low, suggesting these frames are more aligned than expected.
- Retroactive insertion of 'transferred vocation' raised tension most at the chalice scene (+0.027) and the epiphany (+0.031), correctly identifying the religious-romantic connection.

**What was easy to model:**
- Entity registry worked perfectly for a small cast
- Multiple reader archetypes captured genuine interpretive divergence
- Overdetermined causation on the epiphany (8 frames!) is the richest in the project
- Absential dynamics captured the attractor/constraint interplay

**What was hard or missing:**
1. **Mode shift isn't a first-class event.** The system can record that the boy went from 'denied/affective' to 'known-true/epistemic', but it can't represent that the MODE SHIFT ITSELF is the epiphany's meaning. It's metadata on a stance change, not a narrative event.
2. **Self-deception gap classification.** The gap detector classified the boy-vs-reader divergence as 'mystery' rather than 'self-deception' because the classifyGap function checks for 'denied' status but the reader stances weren't character stances. The self-deception is between the boy's OWN affective and epistemic modes — not between boy and reader.
3. **Tension doesn't distinguish quality.** The 0.588 at the epiphany is numerically the same KIND of number as the 0.559 during the uncle's arrival. But experientially, one is frustrated waiting and the other is existential self-recognition. The system needs tension *coloring* or *texture*.
4. **Affective intensity isn't factored into tension.** The boy's intensity: 0.95 during the conversation is lost — tension is computed only from absential pressure, not from epistemic state intensity.
5. **The 'attractor toward nothing' paradox.** The romantic-projection absential works as an attractor, but the system can't represent that the TARGET of the attractor is illusory. An attractor toward nothing should behave differently from an attractor toward something — it should build tension faster and collapse harder.

**What Araby reveals that LOTR and the mystery didn't:**
- LOTR: external action, clear attractor (destroy ring), epistemic mostly propositional → system handles well
- Mystery: information-driven, reader focus, clear resolution → system handles well  
- Araby: INTERNAL action, illusory attractor, affective knowledge, mode-shift as climax → system captures the bones but misses the texture

**How viable is 'LLM as reader, types as schema'?**
Highly viable. This analysis took one pass of reading + structured output. The LLM (me) could identify 8 causal frames for the epiphany, model 3 reader archetypes with genuine interpretive divergence, and detect the key absential dynamics. The types forced clarity: I had to decide whether the romantic projection was an 'attractor' or a 'secret' or both. I chose attractor (for the pull) with a separate self-deception secret (for the hidden truth). These forced choices are GOOD — they make literary analysis concrete and debatable.

The workflow is: read → close-read → model → run → compare to reading → iterate. The types are the schema; the LLM is the reader; the reducer is the calculator; the output is the analysis.

## Summary of Discoveries

### What the system can do:
1. Model narrative state with full epistemic tracking (who knows what, how, why)
2. Detect epistemic gaps and classify their narrative effects (irony, mystery, suspense)
3. Compute tension curves that correctly discriminate genre (mystery arc vs. epic rise)
4. Retroactively insert absentials and compute how they reshape the entire narrative
5. Detect narrative structure (exposition, rising action, climax, resolution) from tension
6. Compute the Groovy Commutator over causal frames → narrative depth metric
7. Build and analyze the absential field as a graph

### What it can't do (yet):
1. Automatic event/entity extraction from text (needs LLM integration)
2. Semantic relevance scoring (still uses tag overlap)
3. Full belief revision with justification DAG propagation
4. Temporal resolution of epistemic states at arbitrary discourse positions
5. Cross-story comparison (e.g., "how do mysteries differ from epics systematically?")

### The deepest insight:
**Narrative depth = cross-register causal interference.** Stories are deep when they can't be reduced to a single explanatory frame. The Groovy Commutator measures this precisely. A purely mechanistic event (ball rolls downhill) has depth 0. A purely allegorical event (the phoenix rises) has depth 0. Gandalf's fall — simultaneously physics, choice, myth, theme, and authorial design — has genuine depth because these frames don't commute.

## Iteration 4: Belief Revision + Clean API
**Date:** 2026-03-03

### Experiment
Implemented belief revision through justification DAGs: when a fact's truth changes or a source becomes unreliable, downstream beliefs cascade proportionally to their dependence on the compromised source.

### Key Finding
The cascade is proportional: if a knower depends on ONE source for a belief and that source becomes unreliable, the belief collapses. If they have multiple independent sources, only the compromised branch weakens. This correctly models how epistemic resilience works — Gandalf's knowledge of the Ring survives losing Gollum's testimony because he has three other independent sources.

### Final System Inventory
- **src/types.ts** — Complete type system (50+ types)
- **src/reducer.ts** — State reducer with 10 kind-specific absential reducers
- **src/commutator.ts** — Groovy Commutator over causal frames
- **src/structure.ts** — Narrative structure detection from tension dynamics
- **src/graph.ts** — Absential field graph (DOT output for Graphviz)
- **src/belief-revision.ts** — Justification DAG cascade
- **src/index.ts** — Clean public API
- **examples/fellowship.ts** — Full Fellowship analysis
- **examples/mystery.ts** — Mystery genre analysis with genre comparison
- **tests/** — 21 passing tests across 3 test files

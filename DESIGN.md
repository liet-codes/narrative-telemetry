# Narrative Telemetry — Design Document

## Core Insight

A story is not a sequence of events. It is a **causal field** where multiple explanatory frames operate simultaneously, where time folds and branches, where things that haven't happened yet and things that are absent exert real force, and where the reader's understanding is itself a moving target that restructures the past.

This document works through the hard problems.

---

## 1. The Writehead Problem

### The naive model is wrong

The first prototype treated narrative state as append-only: event happens → state updates → move forward. But that's not how reading works.

When you read, you're constantly **retroactively discovering causation**. When Gandalf falls in Moria, you realize that his protective presence was an active absential all along — a *constraint against despair* that you didn't notice until it was gone. The constraint didn't begin at his death. It was always there. You just couldn't see it.

This means:

1. **The state history is not append-only.** You must be able to insert absentials retroactively and replay forward.
2. **Absentials can be "latent" — present but unrecognized** until an event makes them visible.
3. **The reader's model of the causal field is distinct from the causal field itself.** The text has a "ground truth" set of absentials; the reader discovers them progressively.

### Architecture implications

We need two layers:

```
┌─────────────────────────────────────┐
│  Authorial Layer (ground truth)     │
│  All absentials, all causation,     │
│  the complete causal field          │
│  - Can be edited at any time        │
│  - Retroactive insertion supported  │
│  - Multiple causal chains coexist   │
└──────────────┬──────────────────────┘
               │ progressive revelation
               ▼
┌─────────────────────────────────────┐
│  Reader Layer (epistemic model)     │
│  What the reader knows/suspects     │
│  at each sjuzhet position           │
│  - Append-only (monotonic)          │
│  - Surprises = delta between layers │
│  - Dramatic irony = reader knows    │
│    what characters don't            │
└─────────────────────────────────────┘
```

The **authorial layer** is mutable. When analysis reveals a previously-unnoticed absential, you insert it at its true origin point and the system replays to compute downstream effects.

The **reader layer** is monotonic in sjuzhet time. The reader can only learn things in discourse order. But what they learn may restructure their understanding of everything prior (anagnorisis).

### Replay mechanics

When a retroactive absential is inserted:

1. Insert the absential at its origin sjuzhet position
2. Replay all subsequent events through the reducer
3. Diff the new state history against the old
4. The diff IS the "retroactive insight" — it shows how the newly-recognized absential was shaping things all along

This is analogous to git rebase: you insert a commit in the past and replay everything after it.

---

## 2. Narrative Ontology

Stories are built from a finite set of entity types. Each type has distinct properties relevant to causal dynamics.

### Entity Types

#### Characters
Agents with interiority. The only entities that can have epistemic states (knowledge, belief, intention).

```
Character {
  id: string
  name: string
  aliases: string[]          // Strider = Aragorn
  location: EntityRef        // Where they are (diegetic)
  status: 'alive' | 'dead' | 'unknown' | 'transformed'
  epistemic: EpistemicState  // What they know/believe
  intentions: Absential[]    // Goals = potentials they're pursuing
  attributes: Record<string, any>
  relationships: Relationship[]
}
```

#### Objects
Things with narrative significance. Can be symbolic, magical, mundane. Objects don't have epistemic states but can have *agency-like* properties (the Ring "wants" to return to Sauron).

```
Object {
  id: string
  name: string
  location: EntityRef        // Who has it, where it is
  properties: Record<string, any>
  symbolic: string[]         // Thematic associations
  agency: number             // 0 = inert, 1 = fully agentive
  // The Ring: agency ~0.7 — it acts but isn't a character
}
```

#### Settings
Locations with atmosphere and constraints. Settings aren't neutral containers — they exert causal pressure. Mordor constrains what's possible. The Shire enables peace.

```
Setting {
  id: string
  name: string
  atmosphere: string[]       // Tags: 'safe', 'hostile', 'liminal'
  constraints: Absential[]   // What this place makes possible/impossible
  contains: EntityRef[]      // Who/what is here
}
```

#### Themes
Extradiegetic patterns that organize meaning. Themes aren't "in" the story the way characters are — they're visible to the reader (and author) but not to characters.

```
Theme {
  id: string
  name: string               // 'power-corrupts', 'sacrifice', 'mercy'
  resonance: number          // 0-1, how active this theme is now
  instances: EventRef[]      // Events that instantiate this theme
}
```

#### Relationships
Connections between any entities. Relationships are themselves causally active — Frodo and Sam's friendship is a *constraint against despair*.

```
Relationship {
  id: string
  between: [EntityRef, EntityRef]
  kind: 'friendship' | 'enmity' | 'loyalty' | 'possession' |
        'fear' | 'love' | 'obligation' | 'mentorship' | string
  strength: number           // 0-1
  absentials: Absential[]    // Causal dynamics this relationship generates
}
```

### Entity References

All entities live in a registry. References are typed:

```
EntityRef = { type: 'character' | 'object' | 'setting' | 'theme' | 'relationship', id: string }
```

---

## 3. Time

### Two clocks, different purposes

#### Diegetic Time (Story-World Clock)

Time as experienced within the fiction. Can be:
- **Precise:** "October 25, Third Age 3018"
- **Relative:** "three days after leaving Rivendell"  
- **Vague:** "long ago, in the Elder Days"
- **Non-linear:** flashbacks, prophecies, songs about the past

Diegetic time is NOT necessarily monotonic in the discourse. A story can jump backward (flashback), forward (flash-forward), or sideways (parallel timelines).

```
DiegeticTime {
  // Flexible coordinate — could be epoch, date, or ordinal
  value: number
  // Human-readable
  label?: string
  // Precision indicator
  precision: 'exact' | 'approximate' | 'vague' | 'mythic'
  // Calendar system within the fiction
  calendar?: string
}
```

#### Extradiegetic Time (Discourse Position)

The monotonic position in the telling. This is where the reader IS in the text. Always moves forward (you can re-read, but the first-read position is canonical).

```
DiscoursePosition {
  // Hierarchical address: book.chapter.section.paragraph.sentence
  // Use as much precision as needed
  book?: number
  chapter: number
  section?: number
  paragraph?: number
  sentence?: number
  // Monotonic sequence number (for easy ordering)
  seq: number
}
```

### Why both matter

The gap between diegetic and extradiegetic time IS narrative technique:

| Technique | Relationship |
|-----------|-------------|
| Flashback | Discourse moves forward, diegetic jumps backward |
| Foreshadowing | Discourse hints at future diegetic time |
| In medias res | Discourse starts mid-diegetic-timeline |
| Summary | Large diegetic span, tiny discourse span |
| Scene | Diegetic ≈ discourse (real-time) |
| Pause | Discourse continues, diegetic time stops (description) |

The *ratio* of diegetic to discourse time at any point is narratologically significant. "Seventeen years pass" in one sentence = extreme compression. The Council of Elrond in real-time = the narrative is saying *this matters, slow down*.

---

## 4. Absential Dynamics (Revised)

### Deacon's Framework, Applied

Terrence Deacon identifies three levels of emergent absence:

1. **Absential (thermodynamic):** Constraints that arise from what ISN'T there. A container constrains gas not by pushing but by *bounding* — the wall's causal power is its impenetrability, which is an absence of passage.

2. **Ententional:** Absence that points toward something. A purpose, a goal, a reference. The Ring's "desire" to return to Sauron is ententional — it references a state that doesn't yet exist.

3. **Teleodynamic:** Self-organizing systems that maintain themselves through reciprocal constraint. The Fellowship is teleodynamic — it's a structure maintained by mutual commitment against dissolution.

### Narrative Absential Types

```
Absential {
  id: string
  kind: AbsentialKind
  description: string
  
  // Temporal coordinates
  origin: DiscoursePosition        // When introduced in discourse
  originDiegetic?: DiegeticTime    // When it "began" in story-world
  resolution?: DiscoursePosition   // When resolved (if ever)
  
  // Causal properties
  pressure: number                 // -1 to 1, current intensity
  direction: 'toward' | 'away'    // Attracting or repelling
  
  // Scope
  affects: EntityRef[]             // Which entities this acts upon
  
  // Visibility
  visibility: 'manifest' | 'latent' | 'retrospective'
  // manifest: reader/characters aware
  // latent: present but unrecognized  
  // retrospective: inserted after discovery
  
  // Causal chains (overdetermination)
  causes: CausalAttribution[]
  
  tags: string[]
}
```

### Absential Kinds (expanded)

```
AbsentialKind =
  | 'constraint'     // Bounds what's possible: "the Ring must be destroyed"
  | 'attractor'      // Pulls toward unrealized state: Mount Doom
  | 'repulsor'       // Pushes away from state: fear of Ring's corruption
  | 'absence'        // Removed thing still causally active: Gandalf's fall
  | 'potential'      // Unrealized possibility: Aragorn's kingship
  | 'tension'        // Between-state generating instability: Gollum's duality
  | 'prophecy'       // Declared future constraining present: "not by the hand of man"
  | 'secret'         // Hidden information shaping behavior: Aragorn's identity
  | 'obligation'     // Debt, promise, oath: Aragorn's oath to Gondor
  | 'entropy'        // Decay, loss, running-out: the Fellowship fragmenting
```

---

## 5. Overdetermined Causation

### The key insight Myk identified

Why did Gandalf die?

1. **Diegetic-mechanical:** The Balrog pulled him off the bridge
2. **Diegetic-intentional:** Gandalf chose to face it so others could escape
3. **Structural-mythic:** The mentor must die for the hero to mature (Campbell)
4. **Thematic:** Sacrifice-for-others instantiates the core theme
5. **Authorial:** Tolkien was writing a mythic eucatastrophe that required loss before redemption

ALL of these are true. They're not competing explanations — they're **layers of the same event**. A good model of narrative causation must support multiple simultaneous causal attributions.

```
CausalAttribution {
  // What frame is this explanation operating in?
  frame: 'diegetic-mechanical'   // Physics, logistics
        | 'diegetic-intentional' // Character choice
        | 'structural'           // Narrative pattern (hero's journey, etc.)
        | 'thematic'             // Theme instantiation
        | 'authorial'            // Extra-fictional authorial intent
        | 'intertextual'         // Reference to other works
        | 'cultural'             // Cultural/historical context
        | string                 // Extensible

  // What absentials/entities does this attribution reference?
  references: EntityRef[]
  
  // Natural language explanation
  description: string
  
  // How "load-bearing" is this explanation? 
  // Can the event be understood without it?
  necessity: number  // 0 = nice-to-have, 1 = essential
}
```

### Extradiegetic causation as first-class

The original prototype kept extradiegetic state as secondary. But Myk is right — authorial/structural causation is as real as diegetic causation. Gandalf dying *because myth demands it* is not a lesser explanation than *because Balrog*.

This means events can have causes that are **outside the story-world entirely**:

- Genre conventions constraining what can happen
- Authorial intent shaping outcomes  
- Intertextual pressure (this story echoing/responding to another)
- Reader expectations as a force (subversion = working against these)

The system should treat these as legitimate causal chains, not metadata.

---

## 6. The Reducer (Revised)

### Event → State Transition

The reducer is the heart. Given current state and an event, produce new state. But now it's more complex:

```
reduce(state: NarrativeState, event: NarrativeEvent): NarrativeState
```

The reducer must:

1. **Update entity states** — move characters, change relationships, reveal information
2. **Process absential interactions** — for each active absential, determine if this event intensifies, weakens, transforms, or resolves it
3. **Introduce new absentials** — events can create new constraints, absences, potentials
4. **Update epistemic states** — who learns what? Does dramatic irony increase or decrease?
5. **Update thematic resonance** — does this event instantiate or complicate active themes?
6. **Record causal attributions** — why did this happen? (multiple frames)
7. **Compute tension** — aggregate measure of unresolved absential pressure

### State shape (revised)

```
NarrativeState {
  // Temporal position
  discourse: DiscoursePosition
  diegetic: DiegeticTime
  
  // Entity registry
  entities: {
    characters: Map<string, Character>
    objects: Map<string, Object>
    settings: Map<string, Setting>
    themes: Map<string, Theme>
    relationships: Map<string, Relationship>
  }
  
  // Active causal field
  absentials: Absential[]
  
  // Aggregate metrics
  tension: number              // 0-1, aggregate unresolved pressure
  ironies: DramaticIrony[]     // Active reader-character knowledge gaps
  
  // Reader model (what the reader understands at this point)
  readerModel: {
    knownFacts: Set<string>
    suspicions: Map<string, number>  // fact → confidence
    expectations: Map<string, number> // what reader expects → confidence
  }
}
```

### Custom reducers per absential kind

The generic reducer won't cut it. Each absential kind has different interaction dynamics:

- **Constraint** intensifies when obstacles appear, resolves when the constraint is met or broken
- **Attractor** strengthens as characters approach it (literally or figuratively)
- **Absence** deepens when the missing thing is needed and isn't there
- **Prophecy** builds tension as fulfillment conditions emerge
- **Secret** builds dramatic irony, resolves explosively when revealed
- **Entropy** increases monotonically unless actively countered

We need a registry of kind-specific reducers:

```
type AbsentialReducer = (
  absential: Absential,
  event: NarrativeEvent,
  state: NarrativeState
) => { absential: Absential; newAbsentials?: Absential[] }
```

---

## 7. The Span Model

### OTEL parallels and divergences

OTEL spans represent units of work in distributed systems. Narrative spans represent units of storytelling. The parallels:

| OTEL | Narrative |
|------|-----------|
| Trace | Complete story |
| Span | Event or scene |
| Span context | Discourse position + diegetic time |
| Attributes | Entity states, causal attributions |
| Events (within span) | Sub-events, beats within a scene |
| Parent/child | Nested narration, frame stories |
| Links | Cross-references, callbacks, echoes |

Key divergence: OTEL spans exist in wall-clock time. Narrative spans exist in *two* time systems simultaneously, and the relationship between them is itself meaningful.

### Span types

```
NarrativeSpan {
  id: string
  
  // What kind of narrative unit is this?
  kind: 'scene'        // Real-time narration
      | 'summary'      // Compressed time
      | 'pause'        // Description, reflection (diegetic time stops)
      | 'flashback'    // Discourse moves forward, diegetic jumps back
      | 'flash_forward'
      | 'ellipsis'     // Time skipped entirely
      | 'frame'        // Wrapper for embedded narration
  
  // Temporal coordinates
  discourse: { start: DiscoursePosition, end: DiscoursePosition }
  diegetic: { start: DiegeticTime, end: DiegeticTime }
  
  // Narrative properties
  focalizer?: EntityRef         // Whose perspective
  reliability: number           // 0-1, is the narrator reliable here?
  
  // The event(s) this span contains
  events: NarrativeEvent[]
  
  // State transition
  stateIn: NarrativeState       // State at span entry
  stateOut: NarrativeState      // State at span exit
  
  // Causal record
  absentialInteractions: AbsentialInteraction[]
  causalAttributions: CausalAttribution[]
  
  // Nesting
  parent?: string               // Parent span ID
  children: string[]            // Child span IDs
}
```

---

## 8. Open Questions

### How do we score relevance?

The current tag-overlap approach is laughably inadequate. Options:

1. **Ontological distance** — build a concept graph, measure path length
2. **Embedding similarity** — use LLM embeddings to compute event-absential relevance
3. **Rule-based** — hand-author relevance rules per absential
4. **Hybrid** — rules for structure, embeddings for semantics

For the prototype, probably (3) with an eye toward (4).

### How do we handle unreliable narration?

If the narrator lies, the *reader layer* gets false information. Later revelation changes the reader's model but not the authorial layer. This is exactly the two-layer architecture handling it correctly — the authorial layer always has ground truth.

### Can this work for non-linear narratives?

Memento, Pulp Fiction, House of Leaves. The discourse ordering is radically non-chronological. Our two-time-system handles this: diegetic time can jump anywhere while discourse position moves forward. The *tension* is computable at each discourse position regardless of diegetic ordering.

### How does this connect to the Groovy Commutator?

Provocatively: the gap between diegetic and extradiegetic causation IS a commutator. Apply "explain via diegetic causes" then "explain via extradiegetic causes" — you get one reading. Reverse the order — you get a different reading. The non-commutativity of these explanatory frames is what makes stories irreducible to either frame alone.

G(event) = C(diegetic(extradiegetic(event)), extradiegetic(diegetic(event)))

When G ≠ 0, the event has genuine narrative depth — it can't be fully explained by either frame alone. When G → 0, the event is either pure plot mechanics (diegetic only) or pure allegory (extradiegetic only). The interesting stuff lives where they interfere.

---

## 9. Implementation Plan

### Phase 1: Foundation (current)
- [x] Core types
- [x] Basic reducer
- [x] Fellowship example
- [ ] Revised type system (this document)
- [ ] Entity registry with references
- [ ] Two-clock temporal system
- [ ] Retroactive absential insertion + replay

### Phase 2: Causal Engine
- [ ] Kind-specific absential reducers
- [ ] Overdetermined causation model
- [ ] Tension computation
- [ ] Epistemic state tracking (who knows what)
- [ ] Dramatic irony detection

### Phase 3: Reader Model
- [ ] Two-layer architecture (authorial + reader)
- [ ] Progressive revelation tracking
- [ ] Surprise/anagnorisis measurement
- [ ] Reader expectation modeling

### Phase 4: Analysis Tools
- [ ] Visualize tension over discourse time
- [ ] Causal graph rendering
- [ ] Absential field visualization
- [ ] Compare diegetic vs extradiegetic causal chains
- [ ] Commutator analysis (where do the frames interfere?)

### Phase 5: LLM Integration
- [ ] Auto-extract events and entities from text
- [ ] Semantic relevance scoring via embeddings
- [ ] Assisted absential discovery (suggest latent dynamics)
- [ ] Natural language queries over narrative state

---

*"The highest function of ecology is understanding consequences."*
*The highest function of narrative analysis is understanding absences.*

— Liet, March 2026

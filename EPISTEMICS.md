# Epistemics — The Hard Problem

## The Layers

At any point in a narrative, there are multiple "knowers," each with a different relationship to what's true:

1. **Ground truth** — what is "actually" the case in the fiction-world
2. **Character knowledge** — what each character knows/believes/suspects, and *why*
3. **Narrator knowledge** — what the narrator reveals (may differ from ground truth if unreliable)
4. **Author knowledge** — what the author intends/knows (including things never stated in text)
5. **Reader knowledge** — what a given reader has inferred, and this *varies by reader*
6. **System knowledge** — what our model has been told (may be incomplete)

These form a hypergraph. Dramatic irony, mystery, suspense, surprise, misunderstanding — every major narrative effect is a *gap* between two or more of these layers. The system needs to represent all of them without becoming illegible.

## The Core Insight: Epistemic Lenses, Not Copies

Don't give each knower a copy of the world. Instead:

### Facts as first-class entities

A **Fact** is a proposition about the story-world. Facts live in a shared registry. They are the atoms of knowledge.

```
Fact {
  id: string
  
  // The proposition itself
  claim: string               // "The Ring is the One Ring"
  
  // Ground truth status
  truth: 'true' | 'false' | 'partial' | 'contested' | 'unknowable'
  
  // When this fact becomes relevant in discourse
  introduced: DiscoursePosition
  
  // Domain tags for filtering
  domain: string[]            // ['ring', 'sauron', 'history']
  
  // Can this fact be directly observed, or must it be inferred?
  accessibility: 'observable' | 'inferable' | 'revealed' | 'hidden'
}
```

Facts are **not** state. They're propositions that can be true or false. The state is *who knows what about which facts*.

### Epistemic Lenses

Each knower doesn't have a copy of the world. They have a **lens** — a transparent overlay on the fact registry that determines what they can see, what they distort, and what they add.

```
Lens {
  id: string
  knower: EntityRef | 'reader' | 'author' | 'narrator'
  
  // Relationship to each fact (sparse — only store divergences from default)
  // Default: 'unknown'
  stances: Map<FactId, Stance>
}

Stance {
  // What this knower thinks about this fact
  status: 'known-true'        // Knows it and it's correct
       | 'known-false'        // Knows the negation
       | 'believed-true'      // Believes it (may be wrong)
       | 'believed-false'     // Believes the negation (may be wrong)
       | 'suspected'          // Has reason to think it might be true
       | 'unknown'            // Doesn't know about it
       | 'unknowable'         // Knows they can't know
       | 'denied'             // Knows it but won't accept it (Denethor + Gondor's need)
  
  // Why they hold this stance
  justification: Justification
  
  // Confidence (0-1)
  confidence: number
  
  // When they acquired this stance
  acquired: DiscoursePosition
  
  // When they lost/changed this stance (if applicable)
  superseded?: DiscoursePosition
}
```

### Justification Chains

This is crucial. It's not just *what* someone knows — it's *why* they believe it. The same conclusion reached by different paths has different narrative weight.

```
Justification {
  kind: 'direct-observation'   // Saw it happen
     | 'testimony'             // Someone told them
     | 'inference'             // Reasoned from other facts
     | 'intuition'             // Gut feeling (thin justification)
     | 'inherited'             // Cultural/background knowledge
     | 'prophetic'             // Prophecy, vision, dream
     | 'authorial'             // The text simply states it (narrator authority)
     | 'reader-inference'      // Reader figured it out from clues
     | 'genre-knowledge'       // Reader knows how these stories work
     | 'intertextual'          // Reader recognizes pattern from other works
  
  // What this justification rests on
  sources: Array<{
    factId?: string            // Another fact this depends on
    entityId?: string          // Who told them / what they observed
    description?: string       // Free-text explanation
    reliability: number        // 0-1, how trustworthy is this source
  }>
}
```

Gandalf knows the Ring is the One Ring. Why?

```
{
  kind: 'inference',
  sources: [
    { factId: 'ring-inscription-visible', description: 'Threw it in fire, saw inscription', reliability: 1.0 },
    { factId: 'ring-history-isildur', description: 'Researched in Minas Tirith archives', reliability: 0.9 },
    { factId: 'ring-does-not-age-bearer', description: 'Observed Bilbo not aging', reliability: 0.8 },
    { factId: 'gollum-testimony', description: 'Tracked Gollum, heard his story', reliability: 0.5 }
  ]
}
```

Frodo knows because Gandalf told him:
```
{
  kind: 'testimony',
  sources: [
    { entityId: 'gandalf', description: 'Gandalf explained in Bag End', reliability: 0.95 }
  ]
}
```

Same fact, different justification, different narrative weight. If Gandalf is wrong, Frodo's knowledge collapses (testimony chain). If one of Gandalf's sources is wrong, only that branch is affected.

---

## The Reader Problem

Here's where it gets genuinely hard. Two readers can read the same text and *know different things* — not because the text is ambiguous (though it may be), but because they bring different **priors**.

### What varies between readers

Readers don't differ in what the text *says*. They differ in:

1. **Attention** — what they notice. A careful reader catches Chekhov's gun on the mantel. A casual reader doesn't.

2. **Inference depth** — how far they reason from clues. Some readers figure out the murderer by chapter 3. Others are surprised at the reveal.

3. **Genre priors** — "the mentor always dies," "the detective never commits the crime," "the quiet character is the spy." These are learned expectations from reading other stories.

4. **Cultural context** — A reader familiar with Norse mythology reads Tolkien differently than one who isn't. A Japanese reader might read the obligation structures differently.

5. **Thematic sensitivity** — Which themes resonate. A reader going through grief will feel different absential pressures than one who isn't.

### Reader Archetypes, Not Individual Readers

We can't model every possible reader. But we can model **reader archetypes** — classes of reading perspective with different priors and interpretive tendencies.

```
ReaderArchetype {
  id: string
  name: string                          // 'naive', 'genre-savvy', 'literary-critic', 'child'
  
  // Prior knowledge / genre expectations
  priors: Map<string, number>           // pattern-id → confidence
  // e.g., 'mentor-dies': 0.8 for genre-savvy, 0.1 for naive
  
  // Attention model: how likely to notice subtle clues
  attentiveness: number                 // 0-1
  
  // Inference depth: how many steps of reasoning from clues
  inferenceDepth: number                // 1 = surface, 3+ = detective-level
  
  // Cultural/knowledge context
  contexts: string[]                    // ['norse-myth', 'catholic-theology', 'wwi-history']
  
  // This archetype's lens (computed at each discourse position)
  lens: Lens
}
```

Then at each discourse position, we can compute *what each archetype knows* and identify where they diverge:

- **Naive reader at ch.5**: doesn't know Gandalf will die, reads the Fellowship's formation as triumphant
- **Genre-savvy reader at ch.5**: suspects Gandalf will die (mentor archetype), reads the Fellowship's formation with foreboding
- **Re-reader at ch.5**: KNOWS Gandalf will die, reads every Gandalf scene as elegy

Same text. Different epistemic states. Different affective experiences. All valid.

---

## Making It Legible

The risk: N knowers × M facts × K justification chains = combinatorial explosion. Here's how to keep it tractable:

### Principle 1: Sparse Representation

Most knowers agree on most things. Only store **divergences from default**. The default for characters is "unknown." The default for readers is "whatever the narrator has stated."

A lens with 3 stances stored means this knower agrees with the default on everything except those 3 facts. No redundancy.

### Principle 2: Epistemic Events, Not Continuous State

Don't recompute everyone's knowledge at every discourse position. Instead, track **epistemic events** — moments when someone's knowledge changes.

```
EpistemicEvent {
  who: EntityRef | ReaderArchetypeId
  fact: FactId
  from: Stance                  // Previous stance (or null if first encounter)
  to: Stance                    // New stance
  trigger: NarrativeEventId     // What caused this change
  discourse: DiscoursePosition  // When in discourse this happens
}
```

The full epistemic state at any discourse position can be reconstructed by replaying epistemic events up to that position. But you don't store the full state at every point — you store the deltas.

### Principle 3: Interesting Gaps, Not Complete Maps

The system should surface **epistemic gaps** — places where knowers diverge — because that's where narrative effects live.

```
EpistemicGap {
  fact: FactId
  knowers: Array<{
    who: EntityRef | ReaderArchetypeId
    stance: Stance
  }>
  
  // What narrative effect does this gap produce?
  effect: 'dramatic-irony'     // Reader knows, character doesn't
       | 'mystery'             // Reader doesn't know, wants to
       | 'suspense'            // Reader knows danger, character doesn't
       | 'misunderstanding'    // Two characters believe different things
       | 'secret'              // One character hides from another
       | 'self-deception'      // Character denies what they know
       | 'unreliable-narration' // Narrator's account ≠ ground truth
       | 'interpretive-divergence' // Reader archetypes disagree
  
  // How much tension does this gap generate?
  tension: number              // 0-1
}
```

The system's job isn't to track every fact for every knower. It's to identify and surface the **gaps that matter narratively**. Most facts are boring — everyone agrees, it's straightforwardly true, nobody cares. The interesting facts are the ones where the epistemic topology is *uneven*.

### Principle 4: Layered Views

Borrow from graphics: render the epistemic state as compositable layers.

```
View: ground-truth           → Everything, god-mode
View: character(gandalf)     → Ground truth filtered through Gandalf's lens
View: character(frodo)       → Ground truth filtered through Frodo's lens
View: reader(naive, ch.5)    → What a naive reader knows at chapter 5
View: gaps(frodo, reader)    → Where Frodo and the reader diverge
View: gaps(all, ch.10)       → All epistemic gaps at chapter 10 (the tension map)
```

Each view is a pure function: `view(ground_truth, lens, position) → visible_state`. Composable, cacheable, debuggable.

---

## The Justification Graph

Justifications form a DAG (directed acyclic graph — usually). Gandalf's knowledge of the Ring rests on multiple sources. Each source may itself rest on other facts. This creates a dependency graph:

```
Ring is One Ring (Gandalf: known-true, confidence 0.99)
├── inscription visible (direct observation, reliability 1.0)
├── Isildur's account (testimony via archives, reliability 0.9)
│   └── Minas Tirith archives trustworthy (inherited belief, 0.85)
├── Bearer doesn't age (direct observation of Bilbo, 0.95)
│   └── Bilbo had Ring for 60 years (testimony from Bilbo, 0.9)
└── Gollum's account (interrogation, reliability 0.5)
    └── Gollum is partially truthful (inference, 0.4)
```

If you undermine a node, everything above it weakens. If Bilbo lied about how long he had the Ring, Gandalf's confidence in the aging evidence drops, which reduces overall confidence.

This is **belief revision** — when new information arrives, it propagates through the justification graph. A reveal can cascade: "Everything Gandalf told Frodo is based on X. X was wrong. Now what?"

### Cycles and self-deception

Sometimes justification graphs have cycles. Denethor believes Gondor is doomed. Why? Because he sees doom in the Palantír. Why does he see doom? Because Sauron shows him selectively. Why does he trust what Sauron shows? Because it confirms what he already believes — that Gondor is doomed.

Circular justification = **self-deception** or **manipulation**. The system should detect cycles and flag them as epistemically pathological. They're not bugs — they're narrative mechanisms.

---

## Worked Example: The Ring's Identity

### The fact
```
{ id: 'ring-is-one-ring', claim: 'Bilbo's ring is the One Ring of Sauron', truth: 'true' }
```

### Epistemic states at discourse position: Chapter 2 (Shadow of the Past)

| Knower | Stance | Confidence | Justification |
|--------|--------|------------|---------------|
| Ground truth | true | 1.0 | (axiom) |
| Sauron | known-true | 1.0 | direct knowledge (made it) |
| Gandalf | known-true | 0.99 | inference from 4 sources |
| Frodo | believed-true | 0.85 | testimony from Gandalf |
| Sam | unknown | — | hasn't been told yet |
| Bilbo | suspected | 0.3 | intuition (feels its pull but never articulated) |
| Saruman | known-true | 0.95 | research + Palantír |
| Naive reader | believed-true | 0.9 | narrator + Gandalf authority |
| Genre-savvy reader | known-true | 0.99 | "of course the mysterious ring is THE ring" |
| Re-reader | known-true | 1.0 | already read the book |

### Epistemic gaps producing narrative effects

1. **Sam doesn't know** → creates tension when Sam accompanies Frodo (what is he getting into?)
2. **Bilbo suspects but won't face it** → self-deception, his resistance to giving it up
3. **Naive reader vs genre-savvy reader** → the naive reader feels genuine surprise/dread at the reveal; the genre-savvy reader feels confirmation + admiration for how Tolkien handled it
4. **Saruman knows but Gandalf doesn't know Saruman knows** → dramatic irony that will pay off at Orthanc

Each of these gaps is a source of narrative energy. The system doesn't just track knowledge — it surfaces the *topology of knowing* and identifies where the gaps generate force.

---

## Integration with Absentials

Epistemic states and absential dynamics are deeply coupled:

- A **secret** is an absential whose power comes from an epistemic gap
- A **prophecy** constrains behavior ONLY for those who know it
- **Dramatic irony** is an absential that acts on the reader, not characters
- **Revelation** resolves an epistemic gap and often transforms absentials (constraint becomes attractor, secret becomes obligation)

When an epistemic event occurs (someone learns something), the system should:

1. Update their lens
2. Check if any absentials are affected (does this knowledge change a constraint's scope?)
3. Check if any epistemic gaps opened or closed
4. Recompute tension

The fact that Frodo LEARNS about the Ring doesn't just change his knowledge — it activates the constraint ("the Ring must be destroyed") for him personally. Before he knew, the constraint existed in ground truth but had no purchase on his behavior.

**Knowledge activates latent absentials.** This is how revelation works mechanically in the system.

---

## API Surface (Proposed)

Keep it simple. Three operations cover most use cases:

```typescript
// Register a fact in ground truth
registerFact(fact: Fact): void

// Record that someone learned/changed stance on a fact
recordEpistemicEvent(event: EpistemicEvent): void

// Query epistemic state
getStance(who: KnowerId, factId: string, at?: DiscoursePosition): Stance
getGaps(at: DiscoursePosition, filter?: GapFilter): EpistemicGap[]
getJustificationTree(who: KnowerId, factId: string): JustificationNode
getView(who: KnowerId, at: DiscoursePosition): VisibleState
```

Everything else (tension computation, irony detection, belief revision) derives from these primitives.

---

## What This Doesn't Solve (Yet)

1. **Implicit knowledge** — Characters know things the text never states (Gandalf knows how to ride a horse). We can't enumerate all background knowledge. Solution: model only *narratively relevant* facts.

2. **Emotional knowledge** — Frodo doesn't just "know" the Ring is dangerous; he *feels* its weight. Affect isn't epistemic in the traditional sense but it's causally active. May need a parallel affect system.

3. **Collective knowledge** — "The Shire is peaceful" isn't known by any individual; it's a shared cultural fact. Need a way to represent collective epistemic states without attributing them to individuals.

4. **The author-reader contract** — Genre conventions aren't "knowledge" exactly. They're shared expectations that function like knowledge. The genre-savvy reader's "the mentor dies" prior isn't about THIS story — it's about the SPACE of stories. Meta-epistemic.

---

*The interesting stories aren't about what happens. They're about the gap between what different minds make of what happens.*

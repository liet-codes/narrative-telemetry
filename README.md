# narrative-telemetry

**Model stories as causal systems using OTEL-like spans, absential dynamics, and reducible narrative state.**

## Thesis

Stories aren't sequences of events — they're *causal fields* where constraints, absences, and unrealized possibilities exert as much force as what actually happens. The Ring doesn't corrupt Frodo through a sequence of actions; it exerts *continuous causal pressure* that shapes every decision, every interaction, every span of narrative time.

We model this using three core ideas:

### 1. Absential Properties (Deacon)

Terrence Deacon's key insight: **things that are absent can be causally efficacious**. A purpose, a threat, a missing piece of information — these aren't just poetic descriptions, they're *real constraints* that shape what happens next.

In narrative terms:
- **Constraints** — The Ring must be destroyed. This absence-of-resolution organizes everything.
- **Attractors** — Mount Doom. Not yet reached, but its gravitational pull structures the journey.
- **Absences** — Gandalf's fall in Moria. His absence reshapes the Fellowship's dynamics.
- **Potentials** — Aragorn's unclaimed kingship. An unrealized state that exerts pressure toward realization.

### 2. Dual Temporality

Stories operate in (at least) two temporal frames:

- **Fabula time** (historical/story time) — the chronological sequence of events *within* the world
- **Sjuzhet time** (discourse/narrative time) — the order in which information is *revealed to the reader*

These often diverge. Frodo learns about the Ring's history long after it happened. The reader learns Snape's true allegiance only at the end. **The causal dynamics of narrative operate in sjuzhet time** — what matters is when the reader/character *learns* something, not when it "happened."

### 3. Redux-like State Reduction

```
event + prior_state (including absential dynamics) → new_state
```

Each narrative event is a **span** (OTEL-style) that:
- Has a start and end in sjuzhet time
- References fabula time coordinates
- Carries attributes (diegetic/extradiegetic, character POV, reliability)
- Interacts with active absential dynamics to produce new state

The state includes:
- **Diegetic state** — what characters know, where they are, what resources they have
- **Extradiegetic state** — what the reader knows, dramatic irony, thematic resonance
- **Active constraints** — unresolved tensions, prophecies, threats, promises
- **Attractors** — states the narrative is being pulled toward
- **Absences** — things removed whose removal is causally active

## Architecture

```
                     Narrative Trace

  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  Span 1  │──→│  Span 2  │──→│  Span 3  │
  │ (event)  │   │ (event)  │   │ (event)  │
  └────┬─────┘   └────┬─────┘   └────┬─────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ State 0 │──→│ State 1 │──→│ State 2 │
  │         │   │         │   │         │
  │ absences│   │ absences│   │ absences│
  │ attract.│   │ attract.│   │ attract.│
  │ constr. │   │ constr. │   │ constr. │
  └─────────┘   └─────────┘   └─────────┘
```

## Status

🧪 Experimental. Research prototype exploring whether narrative structure can be formally modeled as a causal system with absential dynamics.

## License

MIT

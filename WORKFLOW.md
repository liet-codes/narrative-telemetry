# Narrative Telemetry Workflow

## The Pipeline: `narrative-telemetry analyze < story.txt`

### Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Raw Text │ ──▶ │ LLM Reader   │ ──▶ │ Type System  │ ──▶ │ Reducer +    │
│ (stdin)  │     │ (structured  │     │ (validation) │     │ Analysis     │
│          │     │  output)     │     │              │     │              │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                       │                     │                     │
                  close reading         JSON schema          tension curve
                  → entities            conformance          epistemic gaps
                  → events              check                commutator
                  → absentials                               structure
                  → epistemic states                         graph
                  → causal frames
```

### Step 1: LLM Reads the Text

The LLM receives the raw text plus a system prompt:

```
You are a literary analyst. Read this text and produce structured output
conforming to the narrative-telemetry schema. For each element:

ENTITIES: List all characters, objects, settings, themes, relationships.
  For each character: name, aliases, attributes, initial location.
  For objects: symbolic meanings, agency (0-1).

EVENTS: List in discourse order. For each:
  - Description (the actual text moment)
  - Diegetic time (when it happens in story-world)
  - Discourse position (where it appears in the text)
  - Focalizer (whose perspective)
  - Tags (thematic/entity connections)
  - Epistemic effects (who learns/feels/suspects what)
  - Causal attributions (overdetermined: mechanical, intentional,
    structural, thematic, authorial, intertextual, cultural)

ABSENTIALS: What invisible forces shape the narrative?
  - Constraints, attractors, repulsors, absences, tensions, secrets
  - Visibility: manifest, latent, retrospective
  - Pressure and direction

FACTS: What is true in the story-world? What is contested?
  - Truth value, accessibility, domain

READER ARCHETYPES: Model 2-3 reader types with different priors.
  Track their stances independently.
```

### Step 2: Validate Against Schema

The LLM's structured output is validated against TypeScript types.
This catches:
- Missing required fields
- Invalid enum values
- Inconsistent entity references
- Temporal ordering violations

### Step 3: Compute

The reducer processes events in order, computing:
- Tension curve (from absential pressures)
- Epistemic gaps (divergent stances between knowers)
- Commutator matrix (for overdetermined events)
- Narrative structure (from tension derivatives)
- Causal graph (entity-absential-fact network)

### Step 4: Output

Multiple output formats:
- **Terminal:** ASCII tension curve + structure + gaps summary
- **JSON:** Full trace for programmatic analysis
- **DOT:** Graphviz causal field graph
- **Markdown:** Human-readable analysis report

### CLI Sketch

```bash
# Basic analysis
narrative-telemetry analyze < araby.txt

# With specific reader archetypes
narrative-telemetry analyze --readers naive,scholar < araby.txt

# Compare two readings
narrative-telemetry compare reading1.json reading2.json

# Retroactive insertion
narrative-telemetry retro --absential "colonial critique" --at-seq 0 < trace.json

# Output as graph
narrative-telemetry analyze --format dot < araby.txt | dot -Tpng > graph.png
```

### Key Design Insight

The LLM is not a black box here — it's a **structured reader**. The type
system doesn't constrain what the LLM can notice; it constrains how the
LLM must EXPRESS what it notices. This is the difference between:

- "Analyze this story" → free text (uncomputable)
- "Read this story and fill out this form" → structured data (computable)

The form (types) was designed by understanding what matters in narrative:
temporality, epistemics, causation, absential dynamics. The LLM brings
the actual reading. The reducer brings the computation.

### Open Questions

1. **Multi-pass reading:** First pass = events + entities. Second pass =
   absentials (require seeing the whole). Third pass = epistemic states
   (require absentials as context). Does this improve quality?

2. **Reader calibration:** Can we validate reader archetypes against
   actual reader responses? Survey + compare to model predictions?

3. **Cross-text comparison:** What does the tension curve of Araby look
   like vs. Eveline vs. The Dead? Can we see Dubliners' arc across stories?

4. **Affective tension:** The current system misses experiential QUALITY
   of tension. The frustrated waiting (seq 6-7) feels different from
   existential self-recognition (seq 11). How to represent this?

5. **Mode-shift as event:** The affective→epistemic mode shift IS the
   epiphany. Should mode shifts be first-class events with their own
   tension effects?

/**
 * Core types for narrative-telemetry.
 * 
 * The fundamental insight: narrative state isn't just "what has happened" — 
 * it includes absential dynamics (constraints, attractors, absences) that 
 * exert causal pressure over what CAN happen next.
 */

// ─── Temporal Coordinates ───────────────────────────────────────────

/** 
 * Fabula time: when something happens in the story's internal chronology.
 * Could be a date, an epoch, or a relative ordering.
 */
export type FabulaTime = {
  /** Arbitrary numeric coordinate in story-world time */
  t: number
  /** Optional human-readable label: "Third Age 3018", "Tuesday morning" */
  label?: string
}

/**
 * Sjuzhet time: when information is revealed to the reader/audience.
 * This is the PRIMARY temporal axis for narrative causation.
 * Position in the discourse — the telling, not the told.
 */
export type SjuzhetTime = {
  /** Sequential position in the narrative discourse (0-indexed) */
  position: number
  /** Optional: chapter, scene, page reference */
  ref?: string
}

// ─── Absential Dynamics ─────────────────────────────────────────────

/**
 * Deacon's absential categories, adapted for narrative.
 * These are things that DON'T exist (yet/anymore/ever) but shape what does.
 */
export type AbsentialKind = 
  | 'constraint'   // Must/must-not: "The Ring must be destroyed"
  | 'attractor'    // Pulling toward: Mount Doom, the final battle
  | 'absence'      // Removed but causally active: Gandalf's fall
  | 'potential'    // Could-be: Aragorn's unclaimed kingship
  | 'tension'      // Between-state: Gollum's dual nature

export type Absential = {
  id: string
  kind: AbsentialKind
  /** What is absent/unrealized/constraining */
  description: string
  /** When this absential dynamic was introduced (sjuzhet) */
  introduced: SjuzhetTime
  /** When this dynamic was resolved/dissolved, if ever */
  resolved?: SjuzhetTime
  /** Causal pressure: how strongly this shapes events. -1 to 1. */
  pressure: number
  /** Which characters/entities this acts upon */
  scope: string[]
  /** Tags for thematic grouping */
  tags?: string[]
}

// ─── Narrative State ────────────────────────────────────────────────

/**
 * What a character knows at a given point in the narrative.
 * Key for tracking dramatic irony (reader knows ≠ character knows).
 */
export type EpistemicState = {
  characterId: string
  /** Facts this character knows (keyed by fact ID) */
  knows: Record<string, boolean>
  /** Facts this character believes (may be wrong) */
  believes: Record<string, unknown>
}

/**
 * Diegetic state: the state of the story-world itself.
 * Things that are "real" within the fiction.
 */
export type DiegeticState = {
  /** Character locations, statuses, inventories, relationships */
  characters: Record<string, {
    location?: string
    status?: string
    alive?: boolean
    attributes?: Record<string, unknown>
  }>
  /** What each character knows */
  epistemics: EpistemicState[]
  /** World-state facts */
  facts: Record<string, unknown>
}

/**
 * Extradiegetic state: what exists outside the story-world.
 * Reader knowledge, thematic resonance, dramatic irony.
 */
export type ExtradiegeticState = {
  /** What the reader/audience knows */
  readerKnows: Record<string, boolean>
  /** Active dramatic ironies (reader knows X, character doesn't) */
  ironies: Array<{
    factId: string
    /** Who doesn't know */
    ignorant: string[]
    /** Tension level 0-1 */
    tension: number
  }>
  /** Thematic threads and their current resonance */
  themes: Record<string, number>
}

/**
 * Complete narrative state at a point in sjuzhet time.
 * This is the "store" in our Redux analogy.
 */
export type NarrativeState = {
  /** Position in discourse */
  sjuzhet: SjuzhetTime
  /** Corresponding fabula time (may be non-monotonic!) */
  fabula: FabulaTime
  /** State within the story-world */
  diegetic: DiegeticState
  /** State outside the story-world (reader, themes) */
  extradiegetic: ExtradiegeticState
  /** Active absential dynamics — the causal field */
  absentials: Absential[]
}

// ─── Events & Spans ─────────────────────────────────────────────────

/**
 * A narrative event — the "action" in our Redux analogy.
 * Something that happens (or is revealed) that changes state.
 */
export type NarrativeEvent = {
  id: string
  /** What happened, in natural language */
  description: string
  /** When this is revealed in the discourse */
  sjuzhet: SjuzhetTime
  /** When this "actually" happened in story-world time */
  fabula: FabulaTime
  /** Whose perspective this is filtered through */
  focalizer?: string
  /** Is this reliable narration? */
  reliability?: number // 0-1
  /** Tags */
  tags?: string[]
}

/**
 * A narrative span — OTEL-style trace segment.
 * Wraps an event with its causal context and state transition.
 */
export type NarrativeSpan = {
  id: string
  /** The event that drives this span */
  event: NarrativeEvent
  /** State before this event */
  parentState: NarrativeState
  /** State after this event */
  childState: NarrativeState
  /** Which absentials this event interacted with */
  absentialInteractions: Array<{
    absentialId: string
    effect: 'intensified' | 'weakened' | 'resolved' | 'introduced' | 'transformed'
  }>
  /** Child spans (nested events within this span) */
  children?: NarrativeSpan[]
  /** Duration in sjuzhet time (how much narrative space this takes) */
  duration: number
}

// ─── Trace ──────────────────────────────────────────────────────────

/**
 * A complete narrative trace — the full story as a causal system.
 */
export type NarrativeTrace = {
  id: string
  title: string
  /** Initial state before any events */
  initialState: NarrativeState
  /** Ordered sequence of spans */
  spans: NarrativeSpan[]
  /** Metadata */
  metadata?: Record<string, unknown>
}

// ─── Reducer ────────────────────────────────────────────────────────

/**
 * The narrative reducer: takes current state + event → new state.
 * This is where absential dynamics do their work.
 */
export type NarrativeReducer = (
  state: NarrativeState,
  event: NarrativeEvent
) => NarrativeState

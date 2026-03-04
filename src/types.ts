/**
 * Narrative Telemetry — Revised Type System
 * 
 * Models stories as causal fields with:
 * - Entity registry (characters, objects, settings, themes, relationships)
 * - Dual temporality (diegetic + discourse)
 * - Absential dynamics with visibility and overdetermined causation
 * - Full epistemic system (facts, lenses, stances, justification DAGs)
 * - Reader archetypes
 */

// ─── Temporal Coordinates ───────────────────────────────────────────

export type DiegeticTime = {
  value: number
  label?: string
  precision: 'exact' | 'approximate' | 'vague' | 'mythic'
  calendar?: string
}

export type DiscoursePosition = {
  book?: number
  chapter: number
  section?: number
  paragraph?: number
  sentence?: number
  seq: number  // monotonic sequence number for ordering
}

// ─── Entity System ──────────────────────────────────────────────────

export type EntityType = 'character' | 'object' | 'setting' | 'theme' | 'relationship'

export type EntityRef = {
  type: EntityType
  id: string
}

export type Character = {
  id: string
  name: string
  aliases: string[]
  location?: EntityRef
  status: 'alive' | 'dead' | 'unknown' | 'transformed'
  attributes: Record<string, unknown>
}

export type NarrativeObject = {
  id: string
  name: string
  location?: EntityRef
  properties: Record<string, unknown>
  symbolic: string[]
  agency: number  // 0 = inert, 1 = fully agentive
}

export type Setting = {
  id: string
  name: string
  atmosphere: string[]
  contains: EntityRef[]
}

export type Theme = {
  id: string
  name: string
  resonance: number  // 0-1
  instances: string[]  // event IDs
}

export type RelationshipKind = 
  | 'friendship' | 'enmity' | 'loyalty' | 'possession'
  | 'fear' | 'love' | 'obligation' | 'mentorship' | string

export type Relationship = {
  id: string
  between: [EntityRef, EntityRef]
  kind: RelationshipKind
  strength: number  // 0-1
}

export type EntityRegistry = {
  characters: Map<string, Character>
  objects: Map<string, NarrativeObject>
  settings: Map<string, Setting>
  themes: Map<string, Theme>
  relationships: Map<string, Relationship>
}

// ─── Causal Attribution ─────────────────────────────────────────────

export type CausalFrame = 
  | 'diegetic-mechanical'
  | 'diegetic-intentional'
  | 'structural'
  | 'thematic'
  | 'authorial'
  | 'intertextual'
  | 'cultural'
  | string

export type CausalAttribution = {
  frame: CausalFrame
  references: EntityRef[]
  description: string
  necessity: number  // 0 = nice-to-have, 1 = essential
}

// ─── Absential Dynamics ─────────────────────────────────────────────

export type AbsentialKind =
  | 'constraint'
  | 'attractor'
  | 'repulsor'
  | 'absence'
  | 'potential'
  | 'tension'
  | 'prophecy'
  | 'secret'
  | 'obligation'
  | 'entropy'

export type AbsentialVisibility = 'manifest' | 'latent' | 'retrospective'

export type Absential = {
  id: string
  kind: AbsentialKind
  description: string
  origin: DiscoursePosition
  originDiegetic?: DiegeticTime
  resolution?: DiscoursePosition
  pressure: number  // -1 to 1
  direction: 'toward' | 'away'
  affects: EntityRef[]
  visibility: AbsentialVisibility
  causes: CausalAttribution[]
  tags: string[]
}

// ─── Epistemic System ───────────────────────────────────────────────

export type ApprehensionMode =
  | 'epistemic'
  | 'doxastic'
  | 'affective'
  | 'embodied'
  | 'intuitive'
  | 'aesthetic'
  | 'moral'
  | 'traumatic'

export type Fact = {
  id: string
  claim: string
  truth: 'true' | 'false' | 'partial' | 'contested' | 'unknowable'
  introduced: DiscoursePosition
  domain: string[]
  accessibility: 'observable' | 'inferable' | 'revealed' | 'hidden'
}

export type JustificationKind =
  | 'direct-observation'
  | 'testimony'
  | 'inference'
  | 'intuition'
  | 'inherited'
  | 'prophetic'
  | 'authorial'
  | 'reader-inference'
  | 'genre-knowledge'
  | 'intertextual'

export type JustificationSource = {
  factId?: string
  entityId?: string
  description?: string
  reliability: number  // 0-1
}

export type Justification = {
  kind: JustificationKind
  sources: JustificationSource[]
}

export type StanceStatus =
  | 'known-true'
  | 'known-false'
  | 'believed-true'
  | 'believed-false'
  | 'suspected'
  | 'unknown'
  | 'unknowable'
  | 'denied'

export type Stance = {
  status: StanceStatus
  mode: ApprehensionMode
  confidence: number  // 0-1
  justification: Justification
  intensity?: number  // for affective/embodied modes
  volatility?: number // how much this fluctuates
  acquired: DiscoursePosition
  superseded?: DiscoursePosition
}

export type KnowerId = EntityRef | { type: 'reader'; id: string } | { type: 'narrator' } | { type: 'author' }

export type Lens = {
  id: string
  knower: KnowerId
  stances: Map<string, Stance[]>  // factId → stances (multiple modes per fact)
}

// ─── Reader Archetypes ──────────────────────────────────────────────

export type ReaderArchetype = {
  id: string
  name: string
  priors: Map<string, number>  // pattern-id → confidence
  attentiveness: number  // 0-1
  inferenceDepth: number  // 1 = surface, 3+ = detective
  contexts: string[]
}

// ─── Epistemic Events ───────────────────────────────────────────────

export type EpistemicEvent = {
  who: KnowerId
  fact: string  // factId
  from: Stance | null
  to: Stance
  trigger: string  // event ID
  discourse: DiscoursePosition
}

export type EpistemicGapEffect =
  | 'dramatic-irony'
  | 'mystery'
  | 'suspense'
  | 'misunderstanding'
  | 'secret'
  | 'self-deception'
  | 'unreliable-narration'
  | 'interpretive-divergence'

export type EpistemicGap = {
  fact: string  // factId
  knowers: Array<{
    who: KnowerId
    stance: Stance
  }>
  effect: EpistemicGapEffect
  tension: number  // 0-1
}

// ─── Narrative Events & Spans ───────────────────────────────────────

export type NarrativeEvent = {
  id: string
  description: string
  discourse: DiscoursePosition
  diegetic: DiegeticTime
  focalizer?: EntityRef
  reliability?: number
  tags: string[]
  // Events can introduce new absentials
  introduces?: Absential[]
  // Events can resolve absentials
  resolves?: string[]  // absential IDs
  // Epistemic effects
  epistemicEffects?: EpistemicEvent[]
  // Causal attributions for this event
  causation?: CausalAttribution[]
}

export type SpanKind = 'scene' | 'summary' | 'pause' | 'flashback' | 'flash_forward' | 'ellipsis' | 'frame'

export type NarrativeSpan = {
  id: string
  kind: SpanKind
  event: NarrativeEvent
  discourse: { start: DiscoursePosition; end: DiscoursePosition }
  diegetic: { start: DiegeticTime; end: DiegeticTime }
  focalizer?: EntityRef
  reliability: number
  parentState: NarrativeState
  childState: NarrativeState
  absentialInteractions: AbsentialInteraction[]
  parent?: string
  children: string[]
}

export type AbsentialInteraction = {
  absentialId: string
  effect: 'intensified' | 'weakened' | 'resolved' | 'introduced' | 'transformed'
  pressureDelta: number
}

// ─── Narrative State ────────────────────────────────────────────────

export type NarrativeState = {
  discourse: DiscoursePosition
  diegetic: DiegeticTime
  entities: EntityRegistry
  absentials: Absential[]
  facts: Map<string, Fact>
  lenses: Map<string, Lens>  // knower ID → lens
  readerArchetypes: Map<string, ReaderArchetype>
  tension: number  // 0-1 aggregate
  epistemicEvents: EpistemicEvent[]
}

// ─── Reducer Types ──────────────────────────────────────────────────

export type AbsentialReducer = (
  absential: Absential,
  event: NarrativeEvent,
  state: NarrativeState
) => { absential: Absential; newAbsentials?: Absential[] }

export type NarrativeReducer = (
  state: NarrativeState,
  event: NarrativeEvent
) => NarrativeState

// ─── Narrative Trace ────────────────────────────────────────────────

export type NarrativeTrace = {
  id: string
  title: string
  initialState: NarrativeState
  spans: NarrativeSpan[]
  metadata?: Record<string, unknown>
}

/**
 * Narrative state reducer.
 * 
 * The core insight: when an event occurs, it doesn't just "add to history."
 * It interacts with the existing absential field — constraints tighten or
 * loosen, attractors pull harder or dissolve, absences deepen or fill.
 * 
 * The reducer is where Deacon meets Redux.
 */

import type { 
  NarrativeState, 
  NarrativeEvent, 
  NarrativeSpan,
  Absential,
  AbsentialKind 
} from './types.js'

/**
 * Apply an event to narrative state, producing new state.
 * This is a pure function — no mutations.
 */
export function reduce(
  state: NarrativeState, 
  event: NarrativeEvent
): { state: NarrativeState; span: NarrativeSpan } {
  // Deep clone to maintain immutability
  const next: NarrativeState = structuredClone(state)
  
  // Advance sjuzhet time
  next.sjuzhet = { ...event.sjuzhet }
  next.fabula = { ...event.fabula }
  
  // Track absential interactions
  const interactions: NarrativeSpan['absentialInteractions'] = []
  
  // Process each active absential against this event
  next.absentials = next.absentials.map(abs => {
    const updated = processAbsentialInteraction(abs, event, state)
    if (updated.changed) {
      interactions.push({
        absentialId: abs.id,
        effect: updated.effect
      })
    }
    return updated.absential
  })
  
  // Filter out fully resolved absentials (keep them marked, don't remove)
  // They remain in state for reference but stop exerting pressure
  
  const span: NarrativeSpan = {
    id: `span-${event.id}`,
    event,
    parentState: state,
    childState: next,
    absentialInteractions: interactions,
    duration: 1  // Default: 1 unit of sjuzhet time
  }
  
  return { state: next, span }
}

/**
 * Determine how an absential dynamic interacts with an event.
 * This is where the magic happens — where absence meets action.
 */
function processAbsentialInteraction(
  absential: Absential,
  event: NarrativeEvent,
  priorState: NarrativeState
): { 
  absential: Absential
  changed: boolean
  effect: 'intensified' | 'weakened' | 'resolved' | 'introduced' | 'transformed'
} {
  // Already resolved absentials don't interact
  if (absential.resolved) {
    return { absential, changed: false, effect: 'weakened' }
  }
  
  // Check if the event's tags intersect with the absential's scope or tags
  const relevance = computeRelevance(absential, event)
  
  if (relevance === 0) {
    return { absential, changed: false, effect: 'weakened' }
  }
  
  // The absential is relevant to this event — determine the interaction
  const updated = { ...absential }
  let effect: 'intensified' | 'weakened' | 'resolved' | 'transformed' = 'intensified'
  
  // Pressure adjustment based on event-absential dynamics
  // This is a simplified model — real implementation would use
  // custom reducers per absential kind
  if (relevance > 0.7) {
    // Strong relevance — this event directly engages the absential
    if (absential.pressure > 0) {
      // Building toward resolution
      updated.pressure = Math.min(1, absential.pressure + relevance * 0.1)
      effect = 'intensified'
    } else {
      // Working against the absential
      updated.pressure = Math.max(-1, absential.pressure - relevance * 0.1)
      effect = 'weakened'
    }
  }
  
  return { absential: updated, changed: true, effect }
}

/**
 * Compute how relevant an event is to an absential dynamic.
 * Returns 0-1. Higher = more relevant.
 * 
 * This is intentionally simple — a real implementation might use
 * embeddings, ontologies, or custom scoring functions.
 */
function computeRelevance(absential: Absential, event: NarrativeEvent): number {
  const eventTags = new Set(event.tags || [])
  const absentialTags = new Set([...absential.scope, ...(absential.tags || [])])
  
  if (absentialTags.size === 0 || eventTags.size === 0) return 0
  
  let overlap = 0
  for (const tag of eventTags) {
    if (absentialTags.has(tag)) overlap++
  }
  
  return overlap / Math.max(absentialTags.size, eventTags.size)
}

// ─── Builder helpers ────────────────────────────────────────────────

/**
 * Create an initial narrative state.
 */
export function createInitialState(fabula?: { t: number; label?: string }): NarrativeState {
  return {
    sjuzhet: { position: 0 },
    fabula: fabula || { t: 0 },
    diegetic: {
      characters: {},
      epistemics: [],
      facts: {}
    },
    extradiegetic: {
      readerKnows: {},
      ironies: [],
      themes: {}
    },
    absentials: []
  }
}

/**
 * Create an absential dynamic.
 */
export function createAbsential(
  id: string,
  kind: AbsentialKind,
  description: string,
  opts: Partial<Absential> = {}
): Absential {
  return {
    id,
    kind,
    description,
    introduced: opts.introduced || { position: 0 },
    pressure: opts.pressure ?? 0.5,
    scope: opts.scope || [],
    tags: opts.tags,
    ...opts
  }
}

/**
 * Create a narrative event.
 */
export function createEvent(
  id: string,
  description: string,
  sjuzhetPos: number,
  fabulaT: number,
  opts: Partial<NarrativeEvent> = {}
): NarrativeEvent {
  return {
    id,
    description,
    sjuzhet: { position: sjuzhetPos, ref: opts.sjuzhet?.ref },
    fabula: { t: fabulaT, label: opts.fabula?.label },
    ...opts
  }
}

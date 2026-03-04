/**
 * Narrative state reducer — revised.
 * 
 * Kind-specific absential reducers, epistemic event processing,
 * tension computation, and retroactive insertion + replay.
 */

import type {
  NarrativeState,
  NarrativeEvent,
  NarrativeSpan,
  Absential,
  AbsentialKind,
  AbsentialReducer,
  AbsentialInteraction,
  DiscoursePosition,
  DiegeticTime,
  EntityRegistry,
  Fact,
  Lens,
  ReaderArchetype,
  EpistemicEvent,
  EpistemicGap,
  EpistemicGapEffect,
  Stance,
  KnowerId,
  Character,
  NarrativeObject,
  Setting,
  Theme,
  Relationship,
} from './types.js'

// ─── State Construction ─────────────────────────────────────────────

export function createDiscoursePosition(seq: number, chapter = 1, opts: Partial<DiscoursePosition> = {}): DiscoursePosition {
  return { seq, chapter, ...opts }
}

export function createDiegeticTime(value: number, opts: Partial<DiegeticTime> = {}): DiegeticTime {
  return { value, precision: 'approximate', ...opts }
}

export function createInitialState(diegetic?: Partial<DiegeticTime>): NarrativeState {
  return {
    discourse: { seq: 0, chapter: 1 },
    diegetic: { value: 0, precision: 'approximate', ...diegetic },
    entities: {
      characters: new Map(),
      objects: new Map(),
      settings: new Map(),
      themes: new Map(),
      relationships: new Map(),
    },
    absentials: [],
    facts: new Map(),
    lenses: new Map(),
    readerArchetypes: new Map(),
    tension: 0,
    epistemicEvents: [],
  }
}

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
    origin: opts.origin ?? { seq: 0, chapter: 1 },
    pressure: opts.pressure ?? 0.5,
    direction: opts.direction ?? 'toward',
    affects: opts.affects ?? [],
    visibility: opts.visibility ?? 'manifest',
    causes: opts.causes ?? [],
    tags: opts.tags ?? [],
    ...opts,
  }
}

export function createEvent(
  id: string,
  description: string,
  seq: number,
  diegeticValue: number,
  opts: Partial<NarrativeEvent> = {}
): NarrativeEvent {
  return {
    id,
    description,
    discourse: opts.discourse ?? { seq, chapter: 1 },
    diegetic: opts.diegetic ?? { value: diegeticValue, precision: 'approximate' },
    tags: opts.tags ?? [],
    ...opts,
  }
}

export function createFact(id: string, claim: string, opts: Partial<Fact> = {}): Fact {
  return {
    id,
    claim,
    truth: opts.truth ?? 'true',
    introduced: opts.introduced ?? { seq: 0, chapter: 1 },
    domain: opts.domain ?? [],
    accessibility: opts.accessibility ?? 'revealed',
    ...opts,
  }
}

// ─── Kind-Specific Absential Reducers ───────────────────────────────

const kindReducers: Record<AbsentialKind, AbsentialReducer> = {
  constraint(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Constraints intensify when obstacles/engagement appears
    // Resolve when the constraint condition is explicitly met
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.15)
    return { absential: { ...abs, pressure } }
  },

  attractor(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Attractors strengthen as characters approach
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.1)
    return { absential: { ...abs, pressure } }
  },

  repulsor(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    const pressure = Math.min(1, abs.pressure + relevance * 0.1)
    return { absential: { ...abs, pressure } }
  },

  absence(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Absences DEEPEN when the missing thing is needed
    // They don't resolve easily — they transform or fade
    const pressure = Math.min(1, abs.pressure + relevance * 0.2)
    return { absential: { ...abs, pressure } }
  },

  potential(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    // Potentials build slowly
    const pressure = Math.min(1, abs.pressure + relevance * 0.08)
    return { absential: { ...abs, pressure } }
  },

  tension(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Tension oscillates — events can intensify OR release
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.12)
    return { absential: { ...abs, pressure } }
  },

  prophecy(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Prophecies build tension as fulfillment conditions emerge
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.18)
    return { absential: { ...abs, pressure } }
  },

  secret(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Secrets build dramatic irony, resolve explosively when revealed
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.15)
    return { absential: { ...abs, pressure } }
  },

  obligation(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    if (event.resolves?.includes(abs.id)) {
      return { absential: { ...abs, resolution: event.discourse, pressure: 0 } }
    }
    const pressure = Math.min(1, abs.pressure + relevance * 0.1)
    return { absential: { ...abs, pressure } }
  },

  entropy(abs, event, _state) {
    const relevance = computeRelevance(abs, event)
    if (relevance === 0) return { absential: abs }
    
    // Entropy increases monotonically unless actively countered
    // Never resolves on its own
    const pressure = Math.min(1, abs.pressure + relevance * 0.05 + 0.01)
    return { absential: { ...abs, pressure } }
  },
}

// ─── Core Reducer ───────────────────────────────────────────────────

export function reduce(
  state: NarrativeState,
  event: NarrativeEvent
): { state: NarrativeState; span: NarrativeSpan } {
  // Deep clone state (Maps need special handling)
  const next = cloneState(state)

  // Advance temporal position
  next.discourse = { ...event.discourse }
  next.diegetic = { ...event.diegetic }

  const interactions: AbsentialInteraction[] = []

  // 1. Process each active absential through kind-specific reducer
  next.absentials = next.absentials.map(abs => {
    if (abs.resolution) return abs  // already resolved

    const reducer = kindReducers[abs.kind]
    const result = reducer(abs, event, state)
    
    const pressureDelta = result.absential.pressure - abs.pressure
    if (pressureDelta !== 0 || result.absential.resolution) {
      interactions.push({
        absentialId: abs.id,
        effect: result.absential.resolution ? 'resolved'
          : pressureDelta > 0 ? 'intensified' : 'weakened',
        pressureDelta,
      })
    }

    // Add any new absentials spawned by this interaction
    if (result.newAbsentials) {
      next.absentials.push(...result.newAbsentials)
      for (const na of result.newAbsentials) {
        interactions.push({
          absentialId: na.id,
          effect: 'introduced',
          pressureDelta: na.pressure,
        })
      }
    }

    return result.absential
  })

  // 2. Process absentials introduced by the event itself
  if (event.introduces) {
    for (const abs of event.introduces) {
      next.absentials.push(abs)
      interactions.push({
        absentialId: abs.id,
        effect: 'introduced',
        pressureDelta: abs.pressure,
      })
    }
  }

  // 3. Process epistemic events
  if (event.epistemicEffects) {
    for (const ee of event.epistemicEffects) {
      next.epistemicEvents.push(ee)
      applyEpistemicEvent(next, ee)
    }
  }

  // 4. Activate latent absentials based on knowledge changes
  activateLatentAbsentials(next, event)

  // 5. Compute aggregate tension
  next.tension = computeTension(next)

  const span: NarrativeSpan = {
    id: `span-${event.id}`,
    kind: 'scene',
    event,
    discourse: { start: state.discourse, end: next.discourse },
    diegetic: { start: state.diegetic, end: next.diegetic },
    reliability: event.reliability ?? 1.0,
    parentState: state,
    childState: next,
    absentialInteractions: interactions,
    children: [],
  }

  return { state: next, span }
}

// ─── Epistemic Processing ───────────────────────────────────────────

function applyEpistemicEvent(state: NarrativeState, ee: EpistemicEvent): void {
  const knowerId = knowerIdToString(ee.who)
  let lens = state.lenses.get(knowerId)
  if (!lens) {
    lens = { id: knowerId, knower: ee.who, stances: new Map() }
    state.lenses.set(knowerId, lens)
  }

  const existing = lens.stances.get(ee.fact) ?? []
  // Supersede any existing stance with the same mode
  const updated = existing.map(s =>
    s.mode === ee.to.mode && !s.superseded
      ? { ...s, superseded: ee.discourse }
      : s
  )
  updated.push(ee.to)
  lens.stances.set(ee.fact, updated)
}

function activateLatentAbsentials(state: NarrativeState, event: NarrativeEvent): void {
  for (const abs of state.absentials) {
    if (abs.visibility === 'latent') {
      // Check if any epistemic event in this round relates to this absential's tags
      const activated = event.epistemicEffects?.some(ee => {
        const fact = state.facts.get(ee.fact)
        if (!fact) return false
        return fact.domain.some(d => abs.tags.includes(d))
      })
      if (activated) {
        abs.visibility = 'manifest'
      }
    }
  }
}

// ─── Tension Computation ────────────────────────────────────────────

export function computeTension(state: NarrativeState): number {
  const active = state.absentials.filter(a => !a.resolution)
  if (active.length === 0) return 0

  // Tension = RMS of absolute pressures of active absentials
  const sumSq = active.reduce((sum, a) => sum + a.pressure * a.pressure, 0)
  return Math.sqrt(sumSq / active.length)
}

// ─── Epistemic Gap Detection ────────────────────────────────────────

export function detectEpistemicGaps(state: NarrativeState): EpistemicGap[] {
  const gaps: EpistemicGap[] = []

  for (const [factId, fact] of state.facts) {
    const stancesByKnower: Array<{ who: KnowerId; stance: Stance }> = []

    for (const [, lens] of state.lenses) {
      const stances = lens.stances.get(factId)
      if (!stances) continue
      // Get the most recent active stance per mode
      const active = stances.filter(s => !s.superseded)
      for (const s of active) {
        stancesByKnower.push({ who: lens.knower, stance: s })
      }
    }

    if (stancesByKnower.length < 2) continue

    // Check for divergence
    const statuses = new Set(stancesByKnower.map(s => s.stance.status))
    if (statuses.size <= 1) continue

    // Classify the gap
    const effect = classifyGap(stancesByKnower, fact)
    const tension = computeGapTension(stancesByKnower, fact)

    gaps.push({ fact: factId, knowers: stancesByKnower, effect, tension })
  }

  return gaps
}

function classifyGap(
  knowers: Array<{ who: KnowerId; stance: Stance }>,
  fact: Fact
): EpistemicGapEffect {
  const readerStances = knowers.filter(k => 'type' in k.who && k.who.type === 'reader')
  const characterStances = knowers.filter(k => 'type' in k.who && k.who.type === 'character')

  // Reader knows truth, character doesn't
  const readerKnowsTrue = readerStances.some(r =>
    r.stance.status === 'known-true' || r.stance.status === 'believed-true')
  const charDoesntKnow = characterStances.some(c =>
    c.stance.status === 'unknown' || c.stance.status === 'believed-false')

  if (readerKnowsTrue && charDoesntKnow) return 'dramatic-irony'

  // Reader doesn't know
  const readerUnknown = readerStances.some(r => r.stance.status === 'unknown' || r.stance.status === 'suspected')
  if (readerUnknown) return 'mystery'

  // Character denies what they know
  const denied = knowers.some(k => k.stance.status === 'denied')
  if (denied) return 'self-deception'

  // Two characters disagree
  if (characterStances.length >= 2 && new Set(characterStances.map(c => c.stance.status)).size > 1) {
    return 'misunderstanding'
  }

  // Reader archetypes diverge
  if (readerStances.length >= 2 && new Set(readerStances.map(r => r.stance.status)).size > 1) {
    return 'interpretive-divergence'
  }

  return 'secret'
}

function computeGapTension(
  knowers: Array<{ who: KnowerId; stance: Stance }>,
  _fact: Fact
): number {
  // Tension from gap = average confidence of divergent stances
  const confidences = knowers.map(k => k.stance.confidence)
  const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length
  // More confident divergent beliefs = more tension
  return avg
}

// ─── Retroactive Insertion + Replay ─────────────────────────────────

export type StateHistory = Array<{ event: NarrativeEvent; state: NarrativeState }>

export function replay(
  initialState: NarrativeState,
  events: NarrativeEvent[]
): StateHistory {
  const history: StateHistory = []
  let current = initialState

  for (const event of events) {
    const { state } = reduce(current, event)
    history.push({ event, state })
    current = state
  }

  return history
}

export function retroactiveInsert(
  initialState: NarrativeState,
  events: NarrativeEvent[],
  absential: Absential,
  atSeq: number  // insert at this discourse sequence number
): { newHistory: StateHistory; oldHistory: StateHistory; diffs: TensionDiff[] } {
  // Replay without the new absential
  const oldHistory = replay(initialState, events)

  // Insert the absential into the initial state (or at the right point)
  const modifiedState = cloneState(initialState)
  if (atSeq <= initialState.discourse.seq) {
    modifiedState.absentials.push(absential)
  }

  // Replay with the new absential, inserting at the right point
  const newHistory: StateHistory[] = []
  let current = modifiedState
  const newHist: StateHistory = []

  for (const event of events) {
    // If we've reached the insertion point, add the absential
    if (event.discourse.seq >= atSeq && !current.absentials.find(a => a.id === absential.id)) {
      current = cloneState(current)
      current.absentials.push(absential)
    }
    const { state } = reduce(current, event)
    newHist.push({ event, state })
    current = state
  }

  // Compute tension diffs
  const diffs: TensionDiff[] = []
  for (let i = 0; i < Math.min(oldHistory.length, newHist.length); i++) {
    diffs.push({
      seq: oldHistory[i].event.discourse.seq,
      oldTension: oldHistory[i].state.tension,
      newTension: newHist[i].state.tension,
      delta: newHist[i].state.tension - oldHistory[i].state.tension,
    })
  }

  return { newHistory: newHist, oldHistory, diffs }
}

export type TensionDiff = {
  seq: number
  oldTension: number
  newTension: number
  delta: number
}

// ─── Utility ────────────────────────────────────────────────────────

function computeRelevance(absential: Absential, event: NarrativeEvent): number {
  const eventTags = new Set(event.tags)
  const absentialTags = new Set([
    ...absential.tags,
    ...absential.affects.map(e => e.id),
  ])

  if (absentialTags.size === 0 || eventTags.size === 0) return 0

  let overlap = 0
  for (const tag of eventTags) {
    if (absentialTags.has(tag)) overlap++
  }

  return overlap / Math.max(absentialTags.size, eventTags.size)
}

export function knowerIdToString(k: KnowerId): string {
  if ('type' in k) {
    if (k.type === 'narrator') return 'narrator'
    if (k.type === 'author') return 'author'
    return `${k.type}:${k.id}`
  }
  return `entity:${(k as any).id}`
}

function cloneState(state: NarrativeState): NarrativeState {
  return {
    discourse: { ...state.discourse },
    diegetic: { ...state.diegetic },
    entities: {
      characters: new Map(state.entities.characters),
      objects: new Map(state.entities.objects),
      settings: new Map(state.entities.settings),
      themes: new Map(state.entities.themes),
      relationships: new Map(state.entities.relationships),
    },
    absentials: state.absentials.map(a => ({ ...a, affects: [...a.affects], causes: [...a.causes], tags: [...a.tags] })),
    facts: new Map(state.facts),
    lenses: new Map(
      Array.from(state.lenses.entries()).map(([k, v]) => [
        k,
        { ...v, stances: new Map(Array.from(v.stances.entries()).map(([fk, sv]) => [fk, [...sv]])) },
      ])
    ),
    readerArchetypes: new Map(state.readerArchetypes),
    tension: state.tension,
    epistemicEvents: [...state.epistemicEvents],
  }
}

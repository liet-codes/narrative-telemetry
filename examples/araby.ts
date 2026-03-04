/**
 * "Araby" by James Joyce — Narrative Telemetry Analysis
 * 
 * A story where almost nothing happens externally but everything
 * happens internally. Tests whether the system can capture:
 * - Affective knowledge as the dominant mode
 * - Self-deception as invisible lens
 * - Epiphany as simultaneous collapse of attractor + lens + mode shift
 * - The gap between felt intensity and objective triviality
 */

import {
  createInitialState,
  createAbsential,
  createEvent,
  createFact,
  reduce,
  computeTension,
  detectEpistemicGaps,
  replay,
  retroactiveInsert,
  knowerIdToString,
} from '../src/reducer.js'
import {
  commutatorMatrix,
  narrativeDepth,
} from '../src/commutator.js'
import { detectStructure, printStructure } from '../src/structure.js'
import { buildGraph, graphStats } from '../src/graph.js'
import type {
  NarrativeState,
  KnowerId,
  Stance,
  EpistemicEvent,
  EntityRef,
  Absential,
} from '../src/types.js'

// ─── Helpers ────────────────────────────────────────────────────────

function ref(type: EntityRef['type'], id: string): EntityRef {
  return { type, id }
}

function stance(
  status: Stance['status'],
  mode: Stance['mode'],
  confidence: number,
  justification: Stance['justification'],
  seq: number,
  opts: Partial<Stance> = {}
): Stance {
  return { status, mode, confidence, justification, acquired: { seq, chapter: 1 }, ...opts }
}

function ee(
  who: KnowerId,
  fact: string,
  to: Stance,
  trigger: string,
  seq: number,
  from: Stance | null = null
): EpistemicEvent {
  return { who, fact, from, to, trigger, discourse: { seq, chapter: 1 } }
}

// ─── Setup ──────────────────────────────────────────────────────────

const state = createInitialState({ value: 0, label: 'Dublin, late 1890s' })

// Characters
state.entities.characters.set('boy', {
  id: 'boy', name: 'The Boy (narrator)', aliases: [],
  status: 'alive', attributes: { age: 'adolescent' },
  location: ref('setting', 'north-richmond'),
})
state.entities.characters.set('mangans-sister', {
  id: 'mangans-sister', name: "Mangan's Sister", aliases: [],
  status: 'alive', attributes: {},
  location: ref('setting', 'north-richmond'),
})
state.entities.characters.set('uncle', {
  id: 'uncle', name: 'The Uncle', aliases: [],
  status: 'alive', attributes: { drinks: true },
  location: ref('setting', 'north-richmond'),
})
state.entities.characters.set('mrs-mercer', {
  id: 'mrs-mercer', name: 'Mrs Mercer', aliases: [],
  status: 'alive', attributes: { role: "pawnbroker's widow" },
  location: ref('setting', 'north-richmond'),
})

// Settings
state.entities.settings.set('north-richmond', {
  id: 'north-richmond', name: 'North Richmond Street',
  atmosphere: ['blind', 'dead-end', 'musty', 'paralyzed', 'respectable'],
  contains: [ref('character', 'boy'), ref('character', 'mangans-sister')],
})
state.entities.settings.set('bazaar', {
  id: 'bazaar', name: 'Araby Bazaar',
  atmosphere: ['dark', 'closing', 'commercial', 'church-like'],
  contains: [],
})

// Objects
state.entities.objects.set('araby', {
  id: 'araby', name: 'Araby (the bazaar)',
  properties: { orientalist: true, commercial: true },
  symbolic: ['eastern-enchantment', 'grail', 'escape', 'commerce'],
  agency: 0,
})

// Themes
state.entities.themes.set('paralysis', {
  id: 'paralysis', name: 'Paralysis (Dublin)',
  resonance: 0.5, instances: [],
})
state.entities.themes.set('vanity', {
  id: 'vanity', name: 'Vanity / Self-Deception',
  resonance: 0.2, instances: [],
})
state.entities.themes.set('romantic-idealization', {
  id: 'romantic-idealization', name: 'Romantic Idealization',
  resonance: 0.3, instances: [],
})
state.entities.themes.set('epiphany', {
  id: 'epiphany', name: 'Joycean Epiphany',
  resonance: 0.0, instances: [],
})

// Relationships
state.entities.relationships.set('boy-girl', {
  id: 'boy-girl',
  between: [ref('character', 'boy'), ref('character', 'mangans-sister')],
  kind: 'love',
  strength: 0.9,
})

// ─── Facts ──────────────────────────────────────────────────────────

const facts = [
  createFact('girl-is-real-person', "Mangan's sister is an ordinary girl, not a madonna", {
    truth: 'true', domain: ['girl', 'romance', 'vanity'],
    accessibility: 'observable', introduced: { seq: 0, chapter: 1 },
  }),
  createFact('boys-feelings-are-projection', "The boy's romantic feelings are self-generated projection, not love", {
    truth: 'true', domain: ['boy', 'romance', 'vanity', 'self-deception'],
    accessibility: 'inferable', introduced: { seq: 0, chapter: 1 },
  }),
  createFact('araby-is-commercial', "The Araby bazaar is a mundane commercial event, not an enchanted Eastern market", {
    truth: 'true', domain: ['bazaar', 'commerce', 'disillusion'],
    accessibility: 'observable', introduced: { seq: 0, chapter: 1 },
  }),
  createFact('boy-is-vain', "The boy's quest is driven by vanity, not love", {
    truth: 'true', domain: ['boy', 'vanity', 'self-deception'],
    accessibility: 'inferable', introduced: { seq: 0, chapter: 1 },
  }),
  createFact('dublin-paralyzes', "Dublin constrains all transcendence attempts", {
    truth: 'true', domain: ['dublin', 'paralysis'],
    accessibility: 'inferable', introduced: { seq: 0, chapter: 1 },
  }),
]

for (const f of facts) state.facts.set(f.id, f)

// ─── Reader Archetypes ──────────────────────────────────────────────

state.readerArchetypes.set('naive', {
  id: 'naive', name: 'Naive Reader',
  priors: new Map([['first-love-is-real', 0.8], ['quests-succeed', 0.5]]),
  attentiveness: 0.4, inferenceDepth: 1,
  contexts: [],
})
state.readerArchetypes.set('experienced', {
  id: 'experienced', name: 'Experienced Reader',
  priors: new Map([['self-deception-in-youth', 0.7], ['ironic-narration', 0.8]]),
  attentiveness: 0.8, inferenceDepth: 3,
  contexts: ['literary-fiction'],
})
state.readerArchetypes.set('joyce-scholar', {
  id: 'joyce-scholar', name: 'Joyce Scholar',
  priors: new Map([['dubliners-paralysis', 0.95], ['catholic-imagery', 0.9], ['colonial-critique', 0.8]]),
  attentiveness: 0.95, inferenceDepth: 4,
  contexts: ['catholic-theology', 'irish-history', 'literary-modernism'],
})

// ─── Initial Absentials ─────────────────────────────────────────────

const initialAbsentials: Absential[] = [
  createAbsential('dublin-paralysis', 'constraint',
    'Dublin constrains all attempts at transcendence', {
      origin: { seq: 0, chapter: 1 },
      pressure: 0.4, direction: 'away',
      affects: [ref('character', 'boy')],
      visibility: 'latent',
      tags: ['dublin', 'paralysis', 'constraint', 'dead-end'],
    }),
  createAbsential('romantic-projection', 'attractor',
    "The boy's self-generated romantic ideal — an attractor toward nothing real", {
      origin: { seq: 0, chapter: 1 },
      pressure: 0.3, direction: 'toward',
      affects: [ref('character', 'boy'), ref('character', 'mangans-sister')],
      visibility: 'manifest',
      tags: ['boy', 'romance', 'girl', 'vanity', 'projection'],
    }),
  createAbsential('self-deception', 'secret',
    "The boy's vanity is hidden from himself — his 'love' is narcissistic projection", {
      origin: { seq: 0, chapter: 1 },
      pressure: 0.2, direction: 'toward',
      affects: [ref('character', 'boy')],
      visibility: 'latent',
      tags: ['boy', 'vanity', 'self-deception', 'secret'],
    }),
  createAbsential('dead-priest-absence', 'absence',
    'The dead priest haunts the house — failed religious vocation as backdrop', {
      origin: { seq: 0, chapter: 1 },
      pressure: 0.15, direction: 'away',
      affects: [ref('setting', 'north-richmond')],
      visibility: 'latent',
      tags: ['priest', 'death', 'religion', 'paralysis'],
    }),
]

for (const abs of initialAbsentials) state.absentials.push(abs)

// ─── Events ─────────────────────────────────────────────────────────

const boyRef: KnowerId = ref('character', 'boy')
const naiveReader: KnowerId = { type: 'reader', id: 'naive' }
const expReader: KnowerId = { type: 'reader', id: 'experienced' }
const scholarReader: KnowerId = { type: 'reader', id: 'joyce-scholar' }

const events = [
  // Event 0: Setting
  createEvent('setting', 'North Richmond Street, being blind, was a quiet street. Dead priest house, musty books.', 0, 0, {
    tags: ['dublin', 'dead-end', 'paralysis', 'priest', 'death'],
    epistemicEffects: [
      ee(scholarReader, 'dublin-paralyzes',
        stance('believed-true', 'epistemic', 0.8,
          { kind: 'genre-knowledge', sources: [{ description: 'Dubliners = paralysis', reliability: 0.95 }] }, 0),
        'setting', 0),
      ee(expReader, 'dublin-paralyzes',
        stance('suspected', 'intuitive', 0.4,
          { kind: 'reader-inference', sources: [{ description: 'Dead-end street, dead priest — symbolic loading', reliability: 0.7 }] }, 0),
        'setting', 0),
    ],
  }),

  // Event 1: Watching Mangan's sister
  createEvent('watching', 'Every morning I lay on the floor watching her door. Her name was like a summons to all my foolish blood.', 1, 1, {
    tags: ['boy', 'girl', 'romance', 'projection', 'obsession'],
    focalizer: ref('character', 'boy'),
    epistemicEffects: [
      ee(boyRef, 'boys-feelings-are-projection',
        stance('believed-false', 'affective', 0.9,
          { kind: 'intuition', sources: [{ description: 'His feelings are overwhelmingly real to him', reliability: 0.3 }] }, 1,
          { intensity: 0.7, volatility: 0.6 }),
        'watching', 1),
      ee(naiveReader, 'boys-feelings-are-projection',
        stance('believed-false', 'affective', 0.6,
          { kind: 'reader-inference', sources: [{ description: 'Empathy with first-person narrator', reliability: 0.5 }] }, 1),
        'watching', 1),
      ee(expReader, 'boys-feelings-are-projection',
        stance('suspected', 'epistemic', 0.5,
          { kind: 'reader-inference', sources: [{ description: '"foolish blood" — narrator retrospectively marking the folly', reliability: 0.8 }] }, 1),
        'watching', 1),
      ee(scholarReader, 'boys-feelings-are-projection',
        stance('known-true', 'epistemic', 0.75,
          { kind: 'intertextual', sources: [{ description: 'Retroactive narration + "foolish" = mature narrator judging younger self', reliability: 0.9 }] }, 1),
        'watching', 1),
    ],
  }),

  // Event 2: "I bore my chalice safely through a throng of foes"
  createEvent('chalice', 'Her image accompanied me. I imagined I bore my chalice safely through a throng of foes. My body was like a harp.', 2, 2, {
    tags: ['boy', 'romance', 'religion', 'projection', 'vanity', 'chalice'],
    focalizer: ref('character', 'boy'),
    epistemicEffects: [
      ee(boyRef, 'boys-feelings-are-projection',
        stance('denied', 'affective', 0.95,
          { kind: 'intuition', sources: [{ description: 'Religious ecstasy of romantic projection', reliability: 0.2 }] }, 2,
          { intensity: 0.9, volatility: 0.4 }),
        'chalice', 2),
      ee(scholarReader, 'boy-is-vain',
        stance('known-true', 'epistemic', 0.85,
          { kind: 'intertextual', sources: [
            { description: 'Chalice imagery = religious sublimation of desire', reliability: 0.9 },
            { description: 'Dead priest in opening = failed vocation motif', reliability: 0.85 },
          ] }, 2),
        'chalice', 2),
    ],
  }),

  // Event 3: "O love! O love!" in dead priest's room
  createEvent('prayer', 'In the dark room where the priest had died, pressing palms together: "O love! O love!"', 3, 3, {
    tags: ['boy', 'romance', 'religion', 'death', 'priest', 'isolation', 'prayer'],
    focalizer: ref('character', 'boy'),
    introduces: [
      createAbsential('isolation-intensity', 'tension',
        'The boy\'s most intense moment happens in total isolation, in a dead man\'s room', {
          origin: { seq: 3, chapter: 1 },
          pressure: 0.6, direction: 'toward',
          affects: [ref('character', 'boy')],
          tags: ['boy', 'isolation', 'death', 'romance'],
        }),
    ],
  }),

  // Event 4: She speaks — Araby mentioned
  createEvent('conversation', 'She spoke to me. She asked was I going to Araby. "If I go, I will bring you something."', 4, 4, {
    tags: ['boy', 'girl', 'bazaar', 'promise', 'quest'],
    focalizer: ref('character', 'boy'),
    introduces: [
      createAbsential('bazaar-quest', 'attractor',
        'The bazaar becomes a grail quest — bring something back for the beloved', {
          origin: { seq: 4, chapter: 1 },
          pressure: 0.7, direction: 'toward',
          affects: [ref('character', 'boy'), ref('object', 'araby')],
          tags: ['bazaar', 'quest', 'boy', 'girl', 'promise', 'projection'],
        }),
      createAbsential('uncle-obstacle', 'entropy',
        'The uncle\'s unreliability as entropic force — time running out', {
          origin: { seq: 4, chapter: 1 },
          pressure: 0.2, direction: 'away',
          affects: [ref('character', 'boy')],
          tags: ['uncle', 'time', 'obstacle', 'bazaar'],
        }),
    ],
    epistemicEffects: [
      ee(boyRef, 'girl-is-real-person',
        stance('believed-false', 'affective', 0.95,
          { kind: 'direct-observation', sources: [{ description: 'Her neck in lamplight, hair, petticoat border — aesthetic perception overrides reality', reliability: 0.2 }] }, 4,
          { intensity: 0.95, volatility: 0.3 }),
        'conversation', 4),
    ],
  }),

  // Event 5: Obsessive waiting
  createEvent('waiting', 'I chafed against school. The syllables of Araby cast an Eastern enchantment over me.', 5, 5, {
    tags: ['boy', 'bazaar', 'obsession', 'school', 'time', 'enchantment'],
    focalizer: ref('character', 'boy'),
  }),

  // Event 6: Uncle late, Mrs Mercer
  createEvent('uncle-late', 'Uncle forgot. Mrs Mercer gossips. Aunt: "put off your bazaar for this night of Our Lord."', 6, 6, {
    tags: ['uncle', 'time', 'obstacle', 'bazaar', 'frustration', 'dublin', 'paralysis'],
    focalizer: ref('character', 'boy'),
  }),

  // Event 7: Uncle arrives drunk
  createEvent('uncle-arrives', 'Uncle home at nine, drunk. Forgot. Recites "The Arab\'s Farewell to his Steed."', 7, 7, {
    tags: ['uncle', 'bazaar', 'time', 'irony', 'dublin', 'paralysis'],
    focalizer: ref('character', 'boy'),
    epistemicEffects: [
      ee(expReader, 'araby-is-commercial',
        stance('suspected', 'intuitive', 0.5,
          { kind: 'reader-inference', sources: [{ description: "Uncle's poem about farewell = foreshadowing", reliability: 0.7 }] }, 7),
        'uncle-arrives', 7),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [ref('character', 'uncle')],
        description: 'Uncle forgot and came home drunk', necessity: 0.7 },
      { frame: 'thematic', references: [ref('theme', 'paralysis')],
        description: "Dublin's adult world indifferent to the boy's inner intensity", necessity: 0.9 },
      { frame: 'authorial', references: [],
        description: 'Joyce needs the boy to arrive late — disillusionment requires the bazaar closing', necessity: 1.0 },
    ],
  }),

  // Event 8: Journey
  createEvent('journey', 'Deserted train, ruinous houses, twinkling river. Held a florin tightly.', 8, 8, {
    tags: ['bazaar', 'journey', 'desolation', 'dublin', 'boy'],
    focalizer: ref('character', 'boy'),
  }),

  // Event 9: Arrival — dark, closing
  createEvent('arrival', 'Nearly all stalls closed. Darkness. Silence like a church after service. Money counted on a salver.', 9, 9, {
    tags: ['bazaar', 'darkness', 'commerce', 'church', 'disillusion', 'silence'],
    focalizer: ref('character', 'boy'),
    resolves: ['bazaar-quest'],
    epistemicEffects: [
      ee(boyRef, 'araby-is-commercial',
        stance('suspected', 'affective', 0.4,
          { kind: 'direct-observation', sources: [{ description: 'Dark stalls, money on salver, church-silence', reliability: 0.9 }] }, 9,
          { intensity: 0.5, volatility: 0.8 }),
        'arrival', 9),
      ee(naiveReader, 'araby-is-commercial',
        stance('believed-true', 'affective', 0.6,
          { kind: 'direct-observation', sources: [{ description: 'Everything is closing', reliability: 0.9 }] }, 9),
        'arrival', 9),
    ],
  }),

  // Event 10: Overheard flirtation
  createEvent('flirtation', '"O, I never said such a thing!" The young lady spoke out of a sense of duty.', 10, 10, {
    tags: ['bazaar', 'commerce', 'flirtation', 'banality', 'mirror', 'girl', 'vanity'],
    focalizer: ref('character', 'boy'),
    epistemicEffects: [
      ee(boyRef, 'boys-feelings-are-projection',
        stance('suspected', 'epistemic', 0.5,
          { kind: 'inference', sources: [
            { description: 'The shopgirl\'s flirtation mirrors his own romantic commerce', reliability: 0.8 },
          ] }, 10,
          { intensity: 0.7, volatility: 0.9 }),
        'flirtation', 10),
    ],
  }),

  // Event 11: THE EPIPHANY
  createEvent('epiphany',
    'Gazing up into the darkness I saw myself as a creature driven and derided by vanity; and my eyes burned with anguish and anger.', 11, 11, {
    tags: ['boy', 'vanity', 'self-deception', 'epiphany', 'darkness', 'anguish', 'disillusion', 'paralysis'],
    focalizer: ref('character', 'boy'),
    resolves: ['romantic-projection', 'self-deception', 'isolation-intensity'],
    epistemicEffects: [
      // THE MODE SHIFT: affective → epistemic
      ee(boyRef, 'boy-is-vain',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'direct-observation', sources: [
            { description: 'Self-recognition in darkness — propositional knowledge through collapse of affective self-deception', reliability: 1.0 },
          ] }, 11,
          { intensity: 1.0, volatility: 0.1 }),
        'epiphany', 11),
      ee(boyRef, 'boys-feelings-are-projection',
        stance('known-true', 'epistemic', 0.9,
          { kind: 'inference', sources: [
            { description: 'The vanity recognition implies the projection was vanity all along', reliability: 0.95 },
          ] }, 11),
        'epiphany', 11),
      // All reader archetypes converge
      ee(naiveReader, 'boy-is-vain',
        stance('known-true', 'affective', 0.8,
          { kind: 'reader-inference', sources: [{ description: 'The narrator tells us directly', reliability: 1.0 }] }, 11,
          { intensity: 0.9 }),
        'epiphany', 11),
      ee(expReader, 'boy-is-vain',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'reader-inference', sources: [{ description: 'Confirmation of what the signs showed all along', reliability: 1.0 }] }, 11),
        'epiphany', 11),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [ref('setting', 'bazaar')],
        description: 'The dark, closing, empty bazaar — no enchantment, just commerce', necessity: 0.7 },
      { frame: 'diegetic-mechanical', references: [ref('character', 'boy')],
        description: 'Overhearing the shopgirl\'s banal flirtation', necessity: 0.6 },
      { frame: 'diegetic-intentional', references: [ref('character', 'boy')],
        description: 'The boy recognizes the gap between his inner world and outer reality', necessity: 0.9 },
      { frame: 'structural', references: [],
        description: 'Coming-of-age/Bildungsroman requires disillusionment as growth', necessity: 0.8 },
      { frame: 'thematic', references: [ref('theme', 'vanity'), ref('theme', 'paralysis')],
        description: 'Vanity must be exposed; Dublin paralyzes all transcendence attempts', necessity: 0.95 },
      { frame: 'authorial', references: [],
        description: "Joyce's thesis: every Dubliners story ends in paralysis. The most intense inner life leads to the same impotent self-awareness.", necessity: 1.0 },
      { frame: 'intertextual', references: [],
        description: 'The Romantic grail quest inverted — the knight arrives and finds nothing', necessity: 0.7 },
      { frame: 'cultural', references: [],
        description: "Colonial Ireland's relationship to Eastern fantasy (Araby) and British commerce — escape fantasy collapses into commercial reality", necessity: 0.6 },
    ],
  }),
]

// ─── Run ────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════')
console.log('  ARABY — James Joyce (from Dubliners)')
console.log('  Narrative Telemetry Analysis')
console.log('═══════════════════════════════════════════════════════\n')

const history = replay(state, events)

// Tension curve
console.log('── Tension Curve ──────────────────────────────────────\n')
const tensionCurve: Array<{ seq: number; tension: number }> = []
const eventLabels = new Map<number, string>()

for (const { event, state: s } of history) {
  tensionCurve.push({ seq: event.discourse.seq, tension: s.tension })
  eventLabels.set(event.discourse.seq, event.id)
  const bar = '█'.repeat(Math.round(s.tension * 50))
  console.log(`  seq ${String(event.discourse.seq).padStart(2)}: ${bar.padEnd(50)} ${s.tension.toFixed(3)} — ${event.id}`)
}

// Structure
console.log('\n── Narrative Structure ────────────────────────────────\n')
const structure = detectStructure(tensionCurve)
console.log(printStructure(structure, eventLabels))

// Epistemic gaps
console.log('\n── Epistemic Gaps ────────────────────────────────────\n')

const keyMoments = [
  { label: 'After chalice scene (seq 2)', idx: 2 },
  { label: 'After conversation (seq 4)', idx: 4 },
  { label: 'After epiphany (seq 11)', idx: 11 },
]

for (const moment of keyMoments) {
  const s = history[moment.idx].state
  const gaps = detectEpistemicGaps(s)
  console.log(`  ${moment.label}: ${gaps.length} gaps`)
  for (const gap of gaps) {
    const fact = s.facts.get(gap.fact)
    console.log(`    "${fact?.claim?.slice(0, 60) ?? gap.fact}" [${gap.effect}] tension=${gap.tension.toFixed(2)}`)
    for (const k of gap.knowers) {
      const who = knowerIdToString(k.who)
      console.log(`      ${who}: ${k.stance.status} (${k.stance.mode}, conf=${k.stance.confidence.toFixed(2)})`)
    }
  }
  console.log()
}

// Commutator
console.log('── Groovy Commutator: The Epiphany ───────────────────\n')
const epiphanyEvent = events[events.length - 1]
const depth = narrativeDepth(epiphanyEvent)
console.log(`  Narrative depth of the epiphany: ${depth.toFixed(4)}`)
console.log()

const matrix = commutatorMatrix(epiphanyEvent)
for (const r of matrix) {
  if (r.commutator > 0.01) {
    console.log(`  ${r.frameA} × ${r.frameB}: G=${r.commutator.toFixed(4)} — ${r.interpretation}`)
  }
}

// Retroactive insertion
console.log('\n── Retroactive Insight ───────────────────────────────\n')
console.log('  Inserting: "The boy inherits the dead priest\'s failed sacred vocation,')
console.log('  channeling it into romantic idealization."\n')

const retroAbsential = createAbsential('transferred-vocation', 'constraint',
  'The boy inherits the dead priest\'s failed sacred vocation, channeling it into romantic idealization', {
    origin: { seq: 0, chapter: 1 },
    pressure: 0.35, direction: 'toward',
    affects: [ref('character', 'boy')],
    visibility: 'retrospective',
    tags: ['boy', 'priest', 'religion', 'romance', 'chalice', 'vocation'],
  })

const { diffs } = retroactiveInsert(state, events, retroAbsential, 0)
console.log('  Tension diffs:')
for (const d of diffs) {
  const arrow = d.delta > 0 ? '↑' : d.delta < 0 ? '↓' : '='
  console.log(`    seq ${String(d.seq).padStart(2)}: ${d.oldTension.toFixed(3)} → ${d.newTension.toFixed(3)} (${arrow} ${Math.abs(d.delta).toFixed(3)}) — ${eventLabels.get(d.seq)}`)
}

// Graph
console.log('\n── Absential Field Graph ─────────────────────────────\n')
const finalState = history[history.length - 1].state
const graph = buildGraph(finalState)
console.log(graphStats(graph))

// Analysis
console.log('\n── Analysis ──────────────────────────────────────────\n')
const epiphanyTension = history[history.length - 1].state.tension
const peakTension = Math.max(...history.map(h => h.state.tension))
const peakIdx = history.findIndex(h => h.state.tension === peakTension)

console.log('  Tension curve shape: rise → sudden collapse (epiphany)')
console.log(`  Peak tension: ${peakTension.toFixed(3)} at seq ${history[peakIdx].event.discourse.seq} (${history[peakIdx].event.id})`)
console.log(`  Epiphany tension: ${epiphanyTension.toFixed(3)}`)
console.log(`  Drop: ${(peakTension - epiphanyTension).toFixed(3)}`)
console.log()
console.log('  Compare:')
console.log('    Fellowship — continuous rise (epic, unresolved)')
console.log('    Mystery    — rise then drop to zero (puzzle solved)')
console.log('    Araby      — rise → partial collapse (self-knowledge that burns)')
console.log()
console.log('  What Araby reveals about the system:')
console.log('  - Most "knowledge" is affective, not epistemic')
console.log('  - The attractor (romantic projection) points toward NOTHING REAL')
console.log('  - The epiphany resolves through self-knowledge, not action')
console.log('  - Tension should NOT go to zero — anguish and anger remain')
console.log('  - The system needs: mode-shift detection as first-class event')
console.log()

if (epiphanyTension > 0 && epiphanyTension < peakTension * 0.5) {
  console.log('  ✓ The system captures the partial collapse correctly.')
  console.log('    Tension drops but doesn\'t vanish — the burning remains.')
} else if (epiphanyTension === 0) {
  console.log('  ✗ Tension went to zero. The system missed that epiphany')
  console.log('    is not resolution — it\'s a wound that stays open.')
} else {
  console.log('  ~ Tension dropped but not dramatically. The epiphany\'s')
  console.log('    destructive force may not be fully captured.')
}

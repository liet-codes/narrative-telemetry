/**
 * The Fellowship of the Ring — Expanded Example
 * 
 * Demonstrates:
 * - Entity registry with characters, objects, settings, themes, relationships
 * - Multiple characters with divergent epistemic states
 * - Reader archetypes (naive, genre-savvy, re-reader)
 * - Gandalf's fall introducing an absence
 * - Dramatic irony detection
 * - Tension curve over discourse time
 * - Retroactive absential insertion
 * - Causal attribution chains
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
import type {
  NarrativeState,
  KnowerId,
  Stance,
  EpistemicEvent,
  ReaderArchetype,
  Absential,
  EntityRef,
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
  chapter = 1,
  opts: Partial<Stance> = {}
): Stance {
  return { status, mode, confidence, justification, acquired: { seq, chapter }, ...opts }
}

function epistemicEffect(
  who: KnowerId,
  fact: string,
  to: Stance,
  trigger: string,
  seq: number,
  chapter = 1,
  from: Stance | null = null
): EpistemicEvent {
  return { who, fact, from, to, trigger, discourse: { seq, chapter } }
}

// ─── Setup ──────────────────────────────────────────────────────────

const state = createInitialState({ value: 3001, label: 'Third Age 3001' })

// Characters
state.entities.characters.set('frodo', {
  id: 'frodo', name: 'Frodo Baggins', aliases: ['Mr. Underhill'],
  status: 'alive', attributes: { race: 'hobbit' },
  location: ref('setting', 'shire'),
})
state.entities.characters.set('gandalf', {
  id: 'gandalf', name: 'Gandalf', aliases: ['Mithrandir', 'Grey Pilgrim'],
  status: 'alive', attributes: { race: 'maia' },
  location: ref('setting', 'shire'),
})
state.entities.characters.set('sam', {
  id: 'sam', name: 'Samwise Gamgee', aliases: [],
  status: 'alive', attributes: { race: 'hobbit' },
  location: ref('setting', 'shire'),
})
state.entities.characters.set('aragorn', {
  id: 'aragorn', name: 'Aragorn', aliases: ['Strider', 'Elessar'],
  status: 'alive', attributes: { race: 'human', lineage: 'isildur' },
  location: ref('setting', 'wild'),
})
state.entities.characters.set('boromir', {
  id: 'boromir', name: 'Boromir', aliases: [],
  status: 'alive', attributes: { race: 'human' },
  location: ref('setting', 'gondor'),
})

// Objects
state.entities.objects.set('one-ring', {
  id: 'one-ring', name: 'The One Ring',
  location: ref('character', 'frodo'),
  properties: { invisible: true, corrupting: true },
  symbolic: ['power', 'corruption', 'temptation'],
  agency: 0.7,
})

// Settings
state.entities.settings.set('shire', {
  id: 'shire', name: 'The Shire',
  atmosphere: ['safe', 'pastoral', 'innocent'],
  contains: [ref('character', 'frodo'), ref('character', 'sam')],
})
state.entities.settings.set('rivendell', {
  id: 'rivendell', name: 'Rivendell',
  atmosphere: ['safe', 'wise', 'ancient'],
  contains: [],
})
state.entities.settings.set('moria', {
  id: 'moria', name: 'Mines of Moria',
  atmosphere: ['hostile', 'dark', 'ancient', 'fallen'],
  contains: [],
})

// Themes
state.entities.themes.set('power-corrupts', {
  id: 'power-corrupts', name: 'Power Corrupts',
  resonance: 0.3, instances: [],
})
state.entities.themes.set('sacrifice', {
  id: 'sacrifice', name: 'Sacrifice',
  resonance: 0.1, instances: [],
})
state.entities.themes.set('fellowship-bonds', {
  id: 'fellowship-bonds', name: 'The Bonds of Fellowship',
  resonance: 0.2, instances: [],
})

// Relationships
state.entities.relationships.set('frodo-sam', {
  id: 'frodo-sam',
  between: [ref('character', 'frodo'), ref('character', 'sam')],
  kind: 'friendship', strength: 0.9,
})
state.entities.relationships.set('gandalf-frodo', {
  id: 'gandalf-frodo',
  between: [ref('character', 'gandalf'), ref('character', 'frodo')],
  kind: 'mentorship', strength: 0.85,
})

// ─── Facts ──────────────────────────────────────────────────────────

const facts = [
  createFact('ring-is-one-ring', "Bilbo's ring is the One Ring of Sauron", {
    truth: 'true', domain: ['ring', 'sauron', 'history'], accessibility: 'revealed',
    introduced: { seq: 0, chapter: 1 },
  }),
  createFact('ring-must-be-destroyed', 'The One Ring must be destroyed in Mount Doom', {
    truth: 'true', domain: ['ring', 'quest'], accessibility: 'revealed',
    introduced: { seq: 4, chapter: 2 },
  }),
  createFact('aragorn-is-heir', 'Aragorn is the heir of Isildur, rightful King of Gondor', {
    truth: 'true', domain: ['aragorn', 'kingship', 'gondor'], accessibility: 'hidden',
    introduced: { seq: 0, chapter: 1 },
  }),
  createFact('gandalf-will-return', 'Gandalf will return as Gandalf the White', {
    truth: 'true', domain: ['gandalf', 'resurrection'], accessibility: 'hidden',
    introduced: { seq: 0, chapter: 1 },
  }),
  createFact('boromir-tempted', 'Boromir is being corrupted by the Ring', {
    truth: 'true', domain: ['boromir', 'ring', 'corruption'], accessibility: 'inferable',
    introduced: { seq: 6, chapter: 4 },
  }),
]
for (const f of facts) state.facts.set(f.id, f)

// ─── Reader Archetypes ──────────────────────────────────────────────

const naiveReader: ReaderArchetype = {
  id: 'naive', name: 'First-Time Reader',
  priors: new Map([['mentor-dies', 0.1], ['ring-corrupts-bearer', 0.2]]),
  attentiveness: 0.5, inferenceDepth: 1,
  contexts: [],
}
const genreSavvy: ReaderArchetype = {
  id: 'genre-savvy', name: 'Genre-Savvy Reader',
  priors: new Map([['mentor-dies', 0.8], ['ring-corrupts-bearer', 0.9], ['hidden-king', 0.7]]),
  attentiveness: 0.8, inferenceDepth: 3,
  contexts: ['epic-fantasy', 'hero-journey'],
}
const reReader: ReaderArchetype = {
  id: 're-reader', name: 'Re-Reader',
  priors: new Map([['mentor-dies', 1.0], ['ring-corrupts-bearer', 1.0], ['hidden-king', 1.0]]),
  attentiveness: 1.0, inferenceDepth: 5,
  contexts: ['lotr-canon', 'tolkien-scholarship'],
}

state.readerArchetypes.set('naive', naiveReader)
state.readerArchetypes.set('genre-savvy', genreSavvy)
state.readerArchetypes.set('re-reader', reReader)

// ─── Initial Reader Lenses ──────────────────────────────────────────

// Re-reader knows everything from the start
for (const factId of ['ring-is-one-ring', 'gandalf-will-return', 'aragorn-is-heir', 'boromir-tempted']) {
  const lid = 'reader:re-reader'
  if (!state.lenses.has(lid)) {
    state.lenses.set(lid, {
      id: lid, knower: { type: 'reader', id: 're-reader' },
      stances: new Map(),
    })
  }
  const lens = state.lenses.get(lid)!
  lens.stances.set(factId, [
    stance('known-true', 'epistemic', 1.0,
      { kind: 'reader-inference', sources: [{ description: 'Has read the book', reliability: 1.0 }] },
      0, 1),
  ])
}

// ─── Absential Dynamics ─────────────────────────────────────────────

state.absentials.push(
  createAbsential('ring-corruption', 'constraint',
    'The One Ring corrupts its bearer', {
    pressure: 0.3, direction: 'toward',
    affects: [ref('character', 'frodo'), ref('object', 'one-ring')],
    visibility: 'latent', tags: ['ring', 'corruption', 'power'],
    causes: [
      { frame: 'diegetic-mechanical', references: [ref('object', 'one-ring')],
        description: "The Ring's inherent corrupting nature", necessity: 1.0 },
      { frame: 'thematic', references: [ref('theme', 'power-corrupts')],
        description: 'Power corrupts; absolute power corrupts absolutely', necessity: 0.8 },
    ],
  }),
  createAbsential('sauron-rising', 'attractor',
    'Sauron is regathering power and seeking the Ring', {
    pressure: 0.2, direction: 'toward',
    affects: [ref('object', 'one-ring')],
    visibility: 'latent', tags: ['sauron', 'ring', 'war'],
  }),
  createAbsential('quest-to-mordor', 'attractor',
    'The Ring must reach Mount Doom', {
    pressure: 0.1, direction: 'toward',
    affects: [ref('character', 'frodo'), ref('object', 'one-ring')],
    visibility: 'latent', tags: ['ring', 'quest', 'mount-doom'],
  }),
  createAbsential('aragorns-kingship', 'potential',
    "Aragorn's unclaimed throne of Gondor", {
    pressure: 0.2, direction: 'toward',
    affects: [ref('character', 'aragorn')],
    visibility: 'latent', tags: ['aragorn', 'kingship', 'gondor'],
  }),
  createAbsential('boromir-weakness', 'tension',
    "Boromir's desire to use the Ring for Gondor", {
    pressure: 0.1, direction: 'toward',
    affects: [ref('character', 'boromir'), ref('object', 'one-ring')],
    visibility: 'latent', tags: ['boromir', 'ring', 'corruption', 'gondor'],
  }),
)

// ─── Events ─────────────────────────────────────────────────────────

const frodo: KnowerId = { type: 'character', id: 'frodo' }
const sam: KnowerId = { type: 'character', id: 'sam' }
const gandalf: KnowerId = { type: 'character', id: 'gandalf' }
const aragornK: KnowerId = { type: 'character', id: 'aragorn' }
const naiveK: KnowerId = { type: 'reader', id: 'naive' }
const savvyK: KnowerId = { type: 'reader', id: 'genre-savvy' }

const events = [
  // 1. Bilbo's party
  createEvent('bilbo-vanishes',
    "Bilbo puts on the Ring and vanishes at his 111th birthday party",
    1, 3001, {
    discourse: { seq: 1, chapter: 1 },
    diegetic: { value: 3001, precision: 'exact', label: "Bilbo's 111th birthday" },
    focalizer: ref('character', 'frodo'),
    tags: ['bilbo', 'ring', 'shire'],
  }),

  // 2. Gandalf confronts Bilbo
  createEvent('gandalf-confronts-bilbo',
    'Gandalf pressures Bilbo to leave the Ring. Bilbo calls it "my precious."',
    2, 3001, {
    discourse: { seq: 2, chapter: 1 },
    diegetic: { value: 3001, precision: 'exact' },
    focalizer: ref('character', 'gandalf'),
    tags: ['gandalf', 'bilbo', 'ring', 'corruption'],
    epistemicEffects: [
      epistemicEffect(naiveK, 'ring-is-one-ring',
        stance('suspected', 'intuitive', 0.3,
          { kind: 'reader-inference', sources: [{ description: 'Ring feels important/sinister', reliability: 0.5 }] },
          2, 1),
        'gandalf-confronts-bilbo', 2, 1),
      epistemicEffect(savvyK, 'ring-is-one-ring',
        stance('believed-true', 'epistemic', 0.85,
          { kind: 'genre-knowledge', sources: [{ description: 'The mysterious artifact is always THE artifact', reliability: 0.9 }] },
          2, 1),
        'gandalf-confronts-bilbo', 2, 1),
    ],
  }),

  // 3. Seventeen years pass
  createEvent('seventeen-years',
    'Seventeen years pass. Frodo lives quietly. Gandalf researches.',
    3, 3018, {
    discourse: { seq: 3, chapter: 2 },
    diegetic: { value: 3018, precision: 'approximate', label: 'Third Age 3018' },
    tags: ['frodo', 'shire', 'time-passage'],
  }),

  // 4. Gandalf reveals Ring history — THE pivotal epistemic event
  createEvent('ring-history-revealed',
    'Gandalf tells Frodo the Ring is the One Ring. It must be destroyed.',
    4, 3018, {
    discourse: { seq: 4, chapter: 2 },
    diegetic: { value: 3018, precision: 'exact', label: "Gandalf's revelation" },
    focalizer: ref('character', 'frodo'),
    tags: ['gandalf', 'frodo', 'ring', 'sauron', 'history', 'corruption', 'quest'],
    epistemicEffects: [
      epistemicEffect(frodo, 'ring-is-one-ring',
        stance('believed-true', 'epistemic', 0.85,
          { kind: 'testimony', sources: [{ entityId: 'gandalf', description: 'Gandalf explained', reliability: 0.95 }] },
          4, 2),
        'ring-history-revealed', 4, 2),
      epistemicEffect(frodo, 'ring-must-be-destroyed',
        stance('believed-true', 'moral', 0.7,
          { kind: 'testimony', sources: [{ entityId: 'gandalf', reliability: 0.95 }] },
          4, 2, { intensity: 0.6 }),
        'ring-history-revealed', 4, 2),
      epistemicEffect(naiveK, 'ring-is-one-ring',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'authorial', sources: [{ description: 'Narrator confirms via Gandalf', reliability: 1.0 }] },
          4, 2),
        'ring-history-revealed', 4, 2),
      epistemicEffect(savvyK, 'ring-is-one-ring',
        stance('known-true', 'epistemic', 1.0,
          { kind: 'genre-knowledge', sources: [{ description: 'Confirmed', reliability: 1.0 }] },
          4, 2),
        'ring-history-revealed', 4, 2),
    ],
    causation: [
      { frame: 'diegetic-intentional', references: [ref('character', 'gandalf')],
        description: 'Gandalf chose to tell Frodo after years of research', necessity: 1.0 },
      { frame: 'structural', references: [],
        description: 'The Call to Adventure (Campbell) — hero must learn the stakes', necessity: 0.9 },
    ],
  }),

  // 5. Black Riders abroad
  createEvent('riders-abroad',
    'Nazgûl are searching for the Ring. Frodo must leave the Shire.',
    5, 3018, {
    discourse: { seq: 5, chapter: 2 },
    diegetic: { value: 3018, precision: 'exact' },
    tags: ['frodo', 'ring', 'sauron', 'nazgul', 'shire', 'quest'],
    epistemicEffects: [
      epistemicEffect(frodo, 'ring-must-be-destroyed',
        stance('believed-true', 'affective', 0.9,
          { kind: 'direct-observation', sources: [{ description: 'Fear of the Riders', reliability: 1.0 }] },
          5, 2, { intensity: 0.7 }),
        'riders-abroad', 5, 2),
    ],
  }),

  // 6. Council of Elrond — many epistemic states converge
  createEvent('council-of-elrond',
    'The Council of Elrond. All knowledge converges. The quest is agreed upon.',
    6, 3018, {
    discourse: { seq: 6, chapter: 4 },
    diegetic: { value: 3018, precision: 'exact', label: 'Council of Elrond' },
    tags: ['council', 'ring', 'quest', 'fellowship', 'aragorn', 'boromir', 'gandalf', 'frodo'],
    epistemicEffects: [
      epistemicEffect(sam, 'ring-is-one-ring',
        stance('known-true', 'epistemic', 0.9,
          { kind: 'testimony', sources: [{ description: 'Heard at Council', reliability: 0.95 }] },
          6, 4),
        'council-of-elrond', 6, 4),
      epistemicEffect(frodo, 'aragorn-is-heir',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'direct-observation', sources: [{ description: 'Revealed at Council', reliability: 1.0 }] },
          6, 4),
        'council-of-elrond', 6, 4),
      epistemicEffect(naiveK, 'aragorn-is-heir',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'authorial', sources: [{ description: 'Narrator reveals at Council', reliability: 1.0 }] },
          6, 4),
        'council-of-elrond', 6, 4),
      // Naive reader starts to notice Boromir's interest in the Ring
      epistemicEffect(naiveK, 'boromir-tempted',
        stance('suspected', 'intuitive', 0.3,
          { kind: 'reader-inference', sources: [{ description: 'Boromir seems too interested in the Ring', reliability: 0.4 }] },
          6, 4),
        'council-of-elrond', 6, 4),
      // Genre-savvy reader already suspects
      epistemicEffect(savvyK, 'boromir-tempted',
        stance('believed-true', 'epistemic', 0.7,
          { kind: 'genre-knowledge', sources: [{ description: 'The proud warrior always falls to temptation', reliability: 0.8 }] },
          6, 4),
        'council-of-elrond', 6, 4),
    ],
    causation: [
      { frame: 'structural', references: [],
        description: 'Crossing the First Threshold — the quest is formally accepted', necessity: 1.0 },
      { frame: 'diegetic-intentional', references: [ref('character', 'frodo')],
        description: 'Frodo volunteers: "I will take the Ring"', necessity: 1.0 },
    ],
  }),

  // 7. Journey through Moria
  createEvent('entering-moria',
    'The Fellowship enters the Mines of Moria. Darkness and dread.',
    7, 3019, {
    discourse: { seq: 7, chapter: 5 },
    diegetic: { value: 3019, precision: 'approximate', label: 'January 3019' },
    tags: ['moria', 'fellowship', 'gandalf', 'danger'],
  }),

  // 8. THE EVENT: Gandalf falls
  createEvent('gandalf-falls',
    'Gandalf faces the Balrog on the Bridge of Khazad-dûm. "You shall not pass!" He falls.',
    8, 3019, {
    discourse: { seq: 8, chapter: 5 },
    diegetic: { value: 3019, precision: 'exact', label: 'Bridge of Khazad-dûm' },
    focalizer: ref('character', 'frodo'),
    tags: ['gandalf', 'balrog', 'moria', 'fellowship', 'sacrifice', 'loss'],
    introduces: [
      createAbsential('gandalf-absence', 'absence',
        'Gandalf is gone. The Fellowship has lost its guide and protector.', {
        origin: { seq: 8, chapter: 5 },
        pressure: 0.8, direction: 'away',
        affects: [ref('character', 'frodo'), ref('character', 'aragorn')],
        visibility: 'manifest', tags: ['gandalf', 'loss', 'guidance', 'fellowship'],
        causes: [
          { frame: 'diegetic-mechanical', references: [ref('character', 'gandalf')],
            description: 'The Balrog pulled Gandalf into the abyss', necessity: 1.0 },
          { frame: 'diegetic-intentional', references: [ref('character', 'gandalf')],
            description: 'Gandalf chose to face the Balrog so others could escape', necessity: 1.0 },
          { frame: 'structural', references: [],
            description: 'The mentor must die for the hero to mature (Campbell)', necessity: 0.9 },
          { frame: 'thematic', references: [ref('theme', 'sacrifice')],
            description: 'Sacrifice-for-others instantiates the core theme', necessity: 0.8 },
        ],
      }),
    ],
    epistemicEffects: [
      // Frodo experiences this traumatically
      epistemicEffect(frodo, 'gandalf-will-return',
        stance('believed-false', 'traumatic', 0.95,
          { kind: 'direct-observation', sources: [{ description: 'Watched Gandalf fall', reliability: 1.0 }] },
          8, 5, { intensity: 0.95, volatility: 0.1 }),
        'gandalf-falls', 8, 5),
      // Naive reader is shocked
      epistemicEffect(naiveK, 'gandalf-will-return',
        stance('believed-false', 'affective', 0.85,
          { kind: 'direct-observation', sources: [{ description: 'Saw him fall', reliability: 1.0 }] },
          8, 5, { intensity: 0.9 }),
        'gandalf-falls', 8, 5),
      // Genre-savvy reader suspects return
      epistemicEffect(savvyK, 'gandalf-will-return',
        stance('suspected', 'epistemic', 0.6,
          { kind: 'genre-knowledge', sources: [{ description: 'Mentors sometimes return transformed', reliability: 0.5 }] },
          8, 5),
        'gandalf-falls', 8, 5),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [ref('character', 'gandalf')],
        description: 'The Balrog pulled him off the bridge', necessity: 1.0 },
      { frame: 'diegetic-intentional', references: [ref('character', 'gandalf')],
        description: 'Gandalf chose to face it so others could escape', necessity: 1.0 },
      { frame: 'structural', references: [],
        description: "The mentor must die for the hero's maturation", necessity: 0.9 },
      { frame: 'thematic', references: [ref('theme', 'sacrifice')],
        description: 'Sacrifice as the highest expression of fellowship', necessity: 0.8 },
      { frame: 'authorial', references: [],
        description: "Tolkien's eucatastrophe requires loss before redemption", necessity: 0.7 },
    ],
  }),

  // 9. After Moria — the Fellowship grieves
  createEvent('lothlorien-grief',
    'The Fellowship reaches Lothlórien. They grieve Gandalf. Aragorn must lead.',
    9, 3019, {
    discourse: { seq: 9, chapter: 6 },
    diegetic: { value: 3019, precision: 'approximate' },
    tags: ['fellowship', 'gandalf', 'loss', 'aragorn', 'guidance', 'grief'],
  }),

  // 10. Boromir's fall
  createEvent('boromir-attempts-ring',
    'Boromir tries to take the Ring from Frodo. The Fellowship breaks.',
    10, 3019, {
    discourse: { seq: 10, chapter: 7 },
    diegetic: { value: 3019, precision: 'exact', label: 'Amon Hen' },
    tags: ['boromir', 'ring', 'corruption', 'fellowship', 'frodo'],
    resolves: ['boromir-weakness'],
    introduces: [
      createAbsential('fellowship-broken', 'entropy',
        'The Fellowship is sundered. Each group faces its path alone.', {
        origin: { seq: 10, chapter: 7 },
        pressure: 0.6, direction: 'away',
        affects: [ref('character', 'frodo'), ref('character', 'aragorn'), ref('character', 'sam')],
        visibility: 'manifest', tags: ['fellowship', 'separation'],
      }),
    ],
    epistemicEffects: [
      epistemicEffect(naiveK, 'boromir-tempted',
        stance('known-true', 'epistemic', 1.0,
          { kind: 'direct-observation', sources: [{ description: 'Witnessed his attempt', reliability: 1.0 }] },
          10, 7),
        'boromir-attempts-ring', 10, 7),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [ref('object', 'one-ring')],
        description: "The Ring's corrupting influence on Boromir", necessity: 1.0 },
      { frame: 'diegetic-intentional', references: [ref('character', 'boromir')],
        description: "Boromir's desire to save Gondor overrides judgment", necessity: 0.9 },
      { frame: 'thematic', references: [ref('theme', 'power-corrupts')],
        description: 'The strong are most susceptible to the temptation of power', necessity: 0.8 },
    ],
  }),
]

// ─── Run the Reducer ────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║     NARRATIVE TELEMETRY: The Fellowship of the Ring        ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

let current = state
const tensionCurve: Array<{ seq: number; tension: number; event: string }> = []
const allSpans = []

for (const event of events) {
  const result = reduce(current, event)
  allSpans.push(result.span)
  current = result.state

  tensionCurve.push({
    seq: event.discourse.seq,
    tension: current.tension,
    event: event.id,
  })

  console.log(`─── [seq ${event.discourse.seq}] ${event.description.slice(0, 70)} ───`)
  
  if (result.span.absentialInteractions.length > 0) {
    for (const ia of result.span.absentialInteractions) {
      const abs = current.absentials.find(a => a.id === ia.absentialId)
      const arrow = ia.effect === 'intensified' ? '↑' : ia.effect === 'weakened' ? '↓' : ia.effect === 'resolved' ? '✓' : ia.effect === 'introduced' ? '★' : '~'
      console.log(`  ${arrow} [${abs?.kind}] ${abs?.description?.slice(0, 50)}  (p=${abs?.pressure.toFixed(2)})`)
    }
  }
  console.log(`  tension: ${current.tension.toFixed(3)}`)
  console.log()
}

// ─── Tension Curve ──────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║                    TENSION CURVE                           ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const maxBar = 50
for (const pt of tensionCurve) {
  const barLen = Math.round(pt.tension * maxBar)
  const bar = '█'.repeat(barLen) + '░'.repeat(maxBar - barLen)
  console.log(`  seq ${String(pt.seq).padStart(2)}: ${bar} ${pt.tension.toFixed(3)} (${pt.event})`)
}
console.log()

// ─── Epistemic Gaps ─────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║                   EPISTEMIC GAPS                           ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const gaps = detectEpistemicGaps(current)
for (const gap of gaps) {
  const fact = current.facts.get(gap.fact)
  console.log(`  [${gap.effect}] "${fact?.claim}" (tension: ${gap.tension.toFixed(2)})`)
  for (const k of gap.knowers) {
    const who = knowerIdToString(k.who)
    console.log(`    ${who}: ${k.stance.status} (${k.stance.mode}, conf=${k.stance.confidence.toFixed(2)})`)
  }
  console.log()
}

// ─── Causal Attribution Chains ──────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║              CAUSAL ATTRIBUTION: Gandalf Falls             ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const gandalfFalls = events.find(e => e.id === 'gandalf-falls')!
if (gandalfFalls.causation) {
  for (const ca of gandalfFalls.causation) {
    console.log(`  [${ca.frame}] (necessity: ${ca.necessity.toFixed(1)})`)
    console.log(`    ${ca.description}`)
  }
}
console.log()

// ─── Reader Archetype Divergence ────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║           READER ARCHETYPE DIVERGENCE                      ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const readerIds = ['reader:naive', 'reader:genre-savvy', 'reader:re-reader']
const keyFacts = ['gandalf-will-return', 'boromir-tempted', 'ring-is-one-ring']

for (const factId of keyFacts) {
  const fact = current.facts.get(factId)
  console.log(`  "${fact?.claim}":`)
  for (const rid of readerIds) {
    const lens = current.lenses.get(rid)
    const stances = lens?.stances.get(factId)
    if (stances && stances.length > 0) {
      const active = stances.filter(s => !s.superseded)
      for (const s of active) {
        console.log(`    ${rid.replace('reader:', '')}: ${s.status} (${s.mode}, conf=${s.confidence.toFixed(2)})`)
      }
    } else {
      console.log(`    ${rid.replace('reader:', '')}: (no stance)`)
    }
  }
  console.log()
}

// ─── Retroactive Absential Insertion ────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║         RETROACTIVE INSERTION: Gandalf as Shield           ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()
console.log('  Hypothesis: Gandalf\'s protective presence was an active')
console.log('  constraint all along — we only recognize it when he falls.')
console.log()

const gandalfShield = createAbsential(
  'gandalf-shield', 'constraint',
  "Gandalf's presence shields the Fellowship from despair and disorganization", {
  origin: { seq: 1, chapter: 1 },
  pressure: 0.4, direction: 'toward',
  affects: [ref('character', 'frodo'), ref('character', 'aragorn')],
  visibility: 'retrospective',
  tags: ['gandalf', 'fellowship', 'guidance', 'protection'],
})

const { diffs } = retroactiveInsert(state, events, gandalfShield, 1)

console.log('  Tension diffs (old → new):')
for (const d of diffs) {
  const arrow = d.delta > 0.001 ? '↑' : d.delta < -0.001 ? '↓' : '='
  const evt = events.find(e => e.discourse.seq === d.seq)
  console.log(`    seq ${String(d.seq).padStart(2)}: ${d.oldTension.toFixed(3)} → ${d.newTension.toFixed(3)} (${arrow}${Math.abs(d.delta).toFixed(3)}) ${evt?.id}`)
}
console.log()
console.log('  The retroactive absential reveals: Gandalf was shielding the')
console.log('  Fellowship all along. The tension was always higher than we')
console.log('  initially computed — we just couldn\'t see it until he fell.')
console.log()

// ─── Final Absential Field ─────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║                  FINAL ABSENTIAL FIELD                     ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

for (const abs of current.absentials) {
  const status = abs.resolution ? 'RESOLVED' : (abs.visibility === 'latent' ? 'LATENT' : 'ACTIVE')
  console.log(`  [${abs.kind}] ${abs.description.slice(0, 55)}`)
  console.log(`    pressure: ${abs.pressure.toFixed(2)} | visibility: ${abs.visibility} | ${status}`)
  if (abs.causes.length > 0) {
    console.log(`    causes: ${abs.causes.map(c => c.frame).join(', ')}`)
  }
  console.log()
}

// ─── Absential Field Graph ──────────────────────────────────────────

import { buildGraph, graphStats, toDot } from '../src/graph.js'

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║                ABSENTIAL FIELD GRAPH                       ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const graph = buildGraph(current)
console.log(graphStats(graph))
console.log()

// Write DOT file for visualization
import { writeFileSync } from 'fs'
writeFileSync('fellowship-graph.dot', toDot(graph))
console.log('  DOT file written to fellowship-graph.dot')
console.log('  Render with: dot -Tpng fellowship-graph.dot -o fellowship-graph.png')
console.log()

// ─── Narrative Structure ────────────────────────────────────────────

import { detectStructure, printStructure } from '../src/structure.js'

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║              NARRATIVE STRUCTURE                           ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

const structure = detectStructure(tensionCurve)
const eventMap = new Map(events.map(e => [e.discourse.seq, e.id]))
console.log(printStructure(structure, eventMap))
console.log()

// ─── Commutator Analysis ────────────────────────────────────────────

import { commutatorMatrix, narrativeDepth } from '../src/commutator.js'

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║         GROOVY COMMUTATOR: All Overdetermined Events       ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log()

for (const event of events) {
  if (!event.causation || event.causation.length < 2) continue
  const depth = narrativeDepth(event)
  console.log(`  "${event.id}" — depth: ${depth.toFixed(3)}`)
  const matrix = commutatorMatrix(event)
  for (const r of matrix) {
    if (r.commutator > 0.04) {
      console.log(`    ${r.frameA} × ${r.frameB}: G=${r.commutator.toFixed(3)}`)
    }
  }
  console.log()
}

/**
 * A Mystery Story — Where Epistemic Gaps ARE the Plot
 * 
 * "The Locked Room" — a simple murder mystery demonstrating that
 * mystery narrative structure is fundamentally about managing
 * epistemic gaps between reader, detective, and suspects.
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
  knowerIdToString,
} from '../src/reducer.js'
import { commutatorMatrix, narrativeDepth } from '../src/commutator.js'
import type {
  KnowerId,
  Stance,
  EpistemicEvent,
  EntityRef,
} from '../src/types.js'

function ref(type: EntityRef['type'], id: string): EntityRef {
  return { type, id }
}
function stance(
  status: Stance['status'], mode: Stance['mode'], confidence: number,
  justification: Stance['justification'], seq: number, chapter = 1,
  opts: Partial<Stance> = {}
): Stance {
  return { status, mode, confidence, justification, acquired: { seq, chapter }, ...opts }
}
function ee(who: KnowerId, fact: string, to: Stance, trigger: string, seq: number, chapter = 1): EpistemicEvent {
  return { who, fact, from: null, to, trigger, discourse: { seq, chapter } }
}

// ─── Setup ──────────────────────────────────────────────────────────

const state = createInitialState({ value: 1, label: 'Friday evening' })

// Characters
state.entities.characters.set('detective', {
  id: 'detective', name: 'Inspector Chen', aliases: [],
  status: 'alive', attributes: { role: 'detective' },
})
state.entities.characters.set('butler', {
  id: 'butler', name: 'Mr. Harlow', aliases: [],
  status: 'alive', attributes: { role: 'suspect' },
})
state.entities.characters.set('wife', {
  id: 'wife', name: 'Mrs. Ashworth', aliases: [],
  status: 'alive', attributes: { role: 'suspect' },
})
state.entities.characters.set('victim', {
  id: 'victim', name: 'Lord Ashworth', aliases: [],
  status: 'dead', attributes: { role: 'victim' },
})

// Facts — the mystery's truth
const facts = [
  createFact('victim-poisoned', 'Lord Ashworth was poisoned, not stabbed', {
    truth: 'true', domain: ['murder', 'method'], accessibility: 'inferable',
  }),
  createFact('wife-did-it', 'Mrs. Ashworth poisoned her husband', {
    truth: 'true', domain: ['murder', 'killer'], accessibility: 'hidden',
  }),
  createFact('butler-innocent', 'The butler is innocent', {
    truth: 'true', domain: ['murder', 'butler'], accessibility: 'hidden',
  }),
  createFact('locked-room-trick', 'The locked room was staged via hidden passage', {
    truth: 'true', domain: ['murder', 'method', 'room'], accessibility: 'hidden',
  }),
  createFact('wife-motive', 'Mrs. Ashworth discovered her husband\'s affair', {
    truth: 'true', domain: ['murder', 'motive', 'wife'], accessibility: 'inferable',
  }),
]
for (const f of facts) state.facts.set(f.id, f)

// Reader archetypes
state.readerArchetypes.set('naive', {
  id: 'naive', name: 'Naive Mystery Reader',
  priors: new Map([['butler-did-it', 0.6], ['spouse-suspect', 0.3]]),
  attentiveness: 0.4, inferenceDepth: 1, contexts: [],
})
state.readerArchetypes.set('genre-savvy', {
  id: 'genre-savvy', name: 'Genre-Savvy Mystery Reader',
  priors: new Map([['butler-did-it', 0.05], ['spouse-suspect', 0.7], ['obvious-suspect-innocent', 0.8]]),
  attentiveness: 0.9, inferenceDepth: 4, contexts: ['mystery-genre', 'fair-play'],
})

// Absentials
state.absentials.push(
  createAbsential('whodunit', 'secret', 'Who killed Lord Ashworth?', {
    pressure: 0.9, tags: ['murder', 'killer'],
    affects: [ref('character', 'detective')],
  }),
  createAbsential('howdunit', 'secret', 'How was the murder committed in a locked room?', {
    pressure: 0.7, tags: ['murder', 'method', 'room'],
  }),
  createAbsential('whydunit', 'secret', 'What was the motive?', {
    pressure: 0.5, tags: ['murder', 'motive'],
  }),
)

// ─── Events ─────────────────────────────────────────────────────────

const det: KnowerId = { type: 'character', id: 'detective' }
const naiveK: KnowerId = { type: 'reader', id: 'naive' }
const savvyK: KnowerId = { type: 'reader', id: 'genre-savvy' }

const events = [
  createEvent('body-found',
    'Lord Ashworth found dead in his locked study. Apparent stab wound.',
    1, 1, {
    discourse: { seq: 1, chapter: 1 },
    tags: ['murder', 'room', 'victim'],
    epistemicEffects: [
      ee(det, 'victim-poisoned',
        stance('believed-false', 'epistemic', 0.7,
          { kind: 'direct-observation', sources: [{ description: 'Apparent stab wound', reliability: 0.6 }] }, 1),
        'body-found', 1),
      ee(naiveK, 'butler-innocent',
        stance('believed-false', 'doxastic', 0.5,
          { kind: 'genre-knowledge', sources: [{ description: 'The butler always did it', reliability: 0.3 }] }, 1),
        'body-found', 1),
      ee(savvyK, 'butler-innocent',
        stance('believed-true', 'epistemic', 0.7,
          { kind: 'genre-knowledge', sources: [{ description: 'The obvious suspect is never guilty in good mysteries', reliability: 0.8 }] }, 1),
        'body-found', 1),
    ],
  }),

  createEvent('butler-suspicious',
    'Butler was seen near the study. Has no alibi. Nervous when questioned.',
    2, 1, {
    discourse: { seq: 2, chapter: 2 },
    tags: ['butler', 'murder', 'suspect'],
    epistemicEffects: [
      ee(naiveK, 'butler-innocent',
        stance('believed-false', 'epistemic', 0.7,
          { kind: 'reader-inference', sources: [{ description: 'He was near the scene, no alibi!', reliability: 0.6 }] }, 2),
        'butler-suspicious', 2),
      ee(savvyK, 'butler-innocent',
        stance('believed-true', 'epistemic', 0.85,
          { kind: 'genre-knowledge', sources: [{ description: 'Too obvious. Red herring.', reliability: 0.9 }] }, 2),
        'butler-suspicious', 2),
    ],
  }),

  createEvent('poison-discovered',
    'Autopsy reveals: actual cause of death was poison, not the stab wound.',
    3, 2, {
    discourse: { seq: 3, chapter: 3 },
    tags: ['murder', 'method', 'poison'],
    epistemicEffects: [
      ee(det, 'victim-poisoned',
        stance('known-true', 'epistemic', 0.99,
          { kind: 'direct-observation', sources: [{ description: 'Autopsy results', reliability: 0.99 }] }, 3),
        'poison-discovered', 3),
      ee(naiveK, 'victim-poisoned',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'authorial', sources: [{ description: 'Narrator reveals autopsy', reliability: 1.0 }] }, 3),
        'poison-discovered', 3),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [], description: 'Toxicology found the poison', necessity: 1.0 },
      { frame: 'structural', references: [], description: 'Classic mystery twist: first theory is wrong', necessity: 0.9 },
    ],
  }),

  createEvent('wife-affair-clue',
    'Detective finds love letters in the study. Lord Ashworth was having an affair.',
    4, 2, {
    discourse: { seq: 4, chapter: 4 },
    tags: ['wife', 'motive', 'murder'],
    epistemicEffects: [
      ee(det, 'wife-motive',
        stance('suspected', 'epistemic', 0.5,
          { kind: 'inference', sources: [{ description: 'Affair = motive for wife', reliability: 0.7 }] }, 4),
        'wife-affair-clue', 4),
      ee(savvyK, 'wife-did-it',
        stance('believed-true', 'epistemic', 0.75,
          { kind: 'reader-inference', sources: [{ description: 'Poison + affair motive = wife', reliability: 0.8 }] }, 4),
        'wife-affair-clue', 4),
      ee(naiveK, 'wife-did-it',
        stance('suspected', 'intuitive', 0.3,
          { kind: 'reader-inference', sources: [{ description: 'Maybe? But the butler...', reliability: 0.3 }] }, 4),
        'wife-affair-clue', 4),
    ],
  }),

  createEvent('hidden-passage',
    'Detective discovers a hidden passage behind the bookcase in the study.',
    5, 3, {
    discourse: { seq: 5, chapter: 5 },
    tags: ['room', 'method', 'murder'],
    resolves: ['howdunit'],
    epistemicEffects: [
      ee(det, 'locked-room-trick',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'direct-observation', sources: [{ description: 'Found the passage', reliability: 1.0 }] }, 5),
        'hidden-passage', 5),
    ],
    causation: [
      { frame: 'diegetic-mechanical', references: [], description: 'Physical passage exists', necessity: 1.0 },
      { frame: 'structural', references: [], description: 'Locked room must be solvable in fair-play mystery', necessity: 1.0 },
      { frame: 'authorial', references: [], description: 'Author planted clue in chapter 1 (the draft)', necessity: 0.5 },
    ],
  }),

  createEvent('confrontation',
    'Detective confronts Mrs. Ashworth. She confesses to poisoning her husband.',
    6, 3, {
    discourse: { seq: 6, chapter: 6 },
    tags: ['wife', 'murder', 'killer', 'motive', 'confession'],
    resolves: ['whodunit', 'whydunit'],
    epistemicEffects: [
      ee(det, 'wife-did-it',
        stance('known-true', 'epistemic', 1.0,
          { kind: 'testimony', sources: [{ entityId: 'wife', description: 'Confession', reliability: 0.99 }] }, 6),
        'confrontation', 6),
      ee(naiveK, 'wife-did-it',
        stance('known-true', 'epistemic', 1.0,
          { kind: 'authorial', sources: [{ description: 'Confession scene', reliability: 1.0 }] }, 6),
        'confrontation', 6),
      ee(naiveK, 'butler-innocent',
        stance('known-true', 'epistemic', 0.95,
          { kind: 'authorial', sources: [{ description: 'Wife confessed, butler is innocent', reliability: 1.0 }] }, 6),
        'confrontation', 6),
    ],
    causation: [
      { frame: 'diegetic-intentional', references: [ref('character', 'detective')],
        description: 'Detective assembled the evidence chain', necessity: 1.0 },
      { frame: 'structural', references: [],
        description: 'The denouement — all mysteries must resolve', necessity: 1.0 },
      { frame: 'thematic', references: [],
        description: 'Justice and truth prevail', necessity: 0.6 },
    ],
  }),
]

// ─── Run ────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║       NARRATIVE TELEMETRY: The Locked Room (Mystery)       ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

let current = state
const tensionCurve: Array<{ seq: number; tension: number; event: string }> = []

for (const event of events) {
  const result = reduce(current, event)
  current = result.state
  tensionCurve.push({ seq: event.discourse.seq, tension: current.tension, event: event.id })

  console.log(`─── [seq ${event.discourse.seq}] ${event.description.slice(0, 65)} ───`)
  for (const ia of result.span.absentialInteractions) {
    const abs = current.absentials.find(a => a.id === ia.absentialId)
    const arrow = ia.effect === 'resolved' ? '✓' : ia.effect === 'introduced' ? '★' : ia.effect === 'intensified' ? '↑' : '↓'
    console.log(`  ${arrow} [${abs?.kind}] ${abs?.description?.slice(0, 45)}  (p=${abs?.pressure.toFixed(2)})`)
  }
  console.log(`  tension: ${current.tension.toFixed(3)}`)
  console.log()
}

// Tension curve
console.log('── TENSION CURVE ──\n')
const maxBar = 50
for (const pt of tensionCurve) {
  const barLen = Math.round(pt.tension * maxBar)
  const bar = '█'.repeat(barLen) + '░'.repeat(maxBar - barLen)
  console.log(`  seq ${pt.seq}: ${bar} ${pt.tension.toFixed(3)} (${pt.event})`)
}
console.log()

// Epistemic gaps
console.log('── EPISTEMIC GAPS ──\n')
const gaps = detectEpistemicGaps(current)
for (const gap of gaps) {
  const fact = current.facts.get(gap.fact)
  console.log(`  [${gap.effect}] "${fact?.claim}" (tension: ${gap.tension.toFixed(2)})`)
  for (const k of gap.knowers) {
    console.log(`    ${knowerIdToString(k.who)}: ${k.stance.status} (${k.stance.mode})`)
  }
  console.log()
}

if (gaps.length === 0) {
  console.log('  All gaps resolved — mystery solved!\n')
}

// Reader divergence at key moments
console.log('── READER ARCHETYPE DIVERGENCE (butler-innocent) ──\n')
for (const rid of ['reader:naive', 'reader:genre-savvy']) {
  const lens = current.lenses.get(rid)
  const stances = lens?.stances.get('butler-innocent') ?? []
  console.log(`  ${rid}:`)
  for (const s of stances) {
    const sup = s.superseded ? ` [superseded at seq ${s.superseded.seq}]` : ''
    console.log(`    ${s.status} (${s.mode}, conf=${s.confidence.toFixed(2)}) at seq ${s.acquired.seq}${sup}`)
  }
}
console.log()

// Groovy Commutator
console.log('╔══════════════════════════════════════════════════════════════╗')
console.log('║              GROOVY COMMUTATOR ANALYSIS                    ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

const eventsWithCausation = events.filter(e => e.causation && e.causation.length >= 2)
for (const event of eventsWithCausation) {
  const depth = narrativeDepth(event)
  const matrix = commutatorMatrix(event)
  
  console.log(`  "${event.description.slice(0, 55)}..."`)
  console.log(`  Narrative depth: ${depth.toFixed(3)}`)
  for (const r of matrix) {
    console.log(`    [${r.frameA}] × [${r.frameB}]: G=${r.commutator.toFixed(3)} — ${r.interpretation}`)
  }
  console.log()
}

// Compare with Gandalf's fall from the Fellowship example
console.log('── COMPARISON: Gandalf\'s Fall (from fellowship.ts) ──\n')

import {
  createEvent as ce,
} from '../src/reducer.js'

const gandalfFalls = ce('gandalf-falls',
  'Gandalf faces the Balrog on the Bridge of Khazad-dûm. He falls.',
  8, 3019, {
  tags: ['gandalf', 'balrog'],
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
})

const gandalfDepth = narrativeDepth(gandalfFalls)
const gandalfMatrix = commutatorMatrix(gandalfFalls)

console.log(`  Gandalf's fall — Narrative depth: ${gandalfDepth.toFixed(3)}`)
for (const r of gandalfMatrix) {
  console.log(`    [${r.frameA}] × [${r.frameB}]: G=${r.commutator.toFixed(3)} — ${r.interpretation}`)
}
console.log()

console.log('  Insight: Gandalf\'s fall has HIGHER narrative depth than any mystery event')
console.log('  because its causal frames genuinely don\'t commute. "He fell because Balrog"')
console.log('  then "but also because myth requires it" gives a different reading than')
console.log('  "Myth required a death" then "the Balrog was the mechanism."')
console.log('  In mystery, mechanics and structure are aligned. In epic, they interfere.')

// ─── Narrative Structure Detection ──────────────────────────────────

import { detectStructure, printStructure } from '../src/structure.js'

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║           NARRATIVE STRUCTURE DETECTION                    ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

console.log('── Mystery: The Locked Room ──\n')
const mysteryStructure = detectStructure(tensionCurve)
const mysteryEvents = new Map(events.map(e => [e.discourse.seq, e.id]))
console.log(printStructure(mysteryStructure, mysteryEvents))
console.log()

// Fellowship tension curve (hardcoded from the other example for comparison)
const fellowshipTension = [
  { seq: 1, tension: 0.214 },
  { seq: 2, tension: 0.246 },
  { seq: 3, tension: 0.258 },
  { seq: 4, tension: 0.295 },
  { seq: 5, tension: 0.328 },
  { seq: 6, tension: 0.354 },
  { seq: 7, tension: 0.354 },
  { seq: 8, tension: 0.459 },
  { seq: 9, tension: 0.511 },
  { seq: 10, tension: 0.588 },
]
const fellowshipEvents = new Map<number, string>([
  [1, 'bilbo-vanishes'], [2, 'gandalf-confronts'], [3, '17-years'],
  [4, 'ring-revealed'], [5, 'riders-abroad'], [6, 'council'],
  [7, 'enter-moria'], [8, 'gandalf-falls'], [9, 'lothlorien'],
  [10, 'boromir-attempts'],
])

console.log('── Fellowship of the Ring ──\n')
const fellowshipStructure = detectStructure(fellowshipTension)
console.log(printStructure(fellowshipStructure, fellowshipEvents))
console.log()

console.log('  Insight: Mystery = classic arc (rise → climax → resolution)')
console.log('  Fellowship = continuous rising action (we only modeled Book 1)')
console.log('  The structural detection catches the difference automatically.')

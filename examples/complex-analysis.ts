/**
 * Complex Tension Analysis — All Three Stories
 * 
 * Hypothesis: Narrative tension is complex-valued.
 * Magnitude = intensity. Phase = quality/texture.
 * Does the phase tell us something the scalar missed?
 */

import {
  createInitialState,
  createAbsential,
  createEvent,
  createFact,
  reduce,
  computeTension,
  replay,
} from '../src/reducer.js'
import { computeComplexTension, interpretPhase, plotTrajectory, printComplexTensionTable, type ComplexTensionResult } from '../src/complex-tension.js'
import { complexCommutatorMatrix, complexNarrativeDepth } from '../src/complex-commutator.js'
import { toPolar, phaseDeg } from '../src/complex.js'
import type { NarrativeState, NarrativeEvent, EntityRef, Absential, Stance, KnowerId, EpistemicEvent } from '../src/types.js'

function ref(type: EntityRef['type'], id: string): EntityRef { return { type, id } }

// ═══════════════════════════════════════════════════════════════════
//  STORY 1: ARABY
// ═══════════════════════════════════════════════════════════════════

function buildAraby() {
  const state = createInitialState({ value: 0, label: 'Dublin, late 1890s' })

  state.absentials.push(
    createAbsential('dublin-paralysis', 'constraint',
      'Dublin constrains all attempts at transcendence', {
        pressure: 0.4, direction: 'away',
        affects: [ref('character', 'boy')],
        visibility: 'latent',
        tags: ['dublin', 'paralysis', 'constraint', 'dead-end'],
      }),
    createAbsential('romantic-projection', 'attractor',
      "The boy's self-generated romantic ideal", {
        pressure: 0.3, direction: 'toward',
        affects: [ref('character', 'boy')],
        visibility: 'manifest',
        tags: ['boy', 'romance', 'girl', 'vanity', 'projection'],
      }),
    createAbsential('self-deception', 'secret',
      "The boy's vanity hidden from himself", {
        pressure: 0.2, direction: 'toward',
        affects: [ref('character', 'boy')],
        visibility: 'latent',
        tags: ['boy', 'vanity', 'self-deception', 'secret'],
      }),
    createAbsential('dead-priest-absence', 'absence',
      'Dead priest haunts the house', {
        pressure: 0.15, direction: 'away',
        affects: [ref('setting', 'north-richmond')],
        visibility: 'latent',
        tags: ['priest', 'death', 'religion', 'paralysis'],
      }),
  )

  const events = [
    createEvent('setting', 'North Richmond Street, being blind', 0, 0, {
      tags: ['dublin', 'dead-end', 'paralysis', 'priest', 'death'],
    }),
    createEvent('watching', 'Every morning watching her door', 1, 1, {
      tags: ['boy', 'girl', 'romance', 'projection', 'obsession'],
    }),
    createEvent('chalice', 'I bore my chalice safely through a throng of foes', 2, 2, {
      tags: ['boy', 'romance', 'religion', 'projection', 'vanity', 'chalice'],
    }),
    createEvent('prayer', 'O love! O love! in the dead priest\'s room', 3, 3, {
      tags: ['boy', 'romance', 'religion', 'death', 'priest', 'isolation', 'prayer'],
      introduces: [
        createAbsential('isolation-intensity', 'tension',
          'Most intense moment in total isolation', {
            origin: { seq: 3, chapter: 1 },
            pressure: 0.6, direction: 'toward',
            affects: [ref('character', 'boy')],
            tags: ['boy', 'isolation', 'death', 'romance'],
          }),
      ],
    }),
    createEvent('conversation', 'She asked was I going to Araby', 4, 4, {
      tags: ['boy', 'girl', 'bazaar', 'promise', 'quest'],
      introduces: [
        createAbsential('bazaar-quest', 'attractor',
          'Bazaar becomes grail quest', {
            origin: { seq: 4, chapter: 1 },
            pressure: 0.7, direction: 'toward',
            affects: [ref('character', 'boy')],
            tags: ['bazaar', 'quest', 'boy', 'girl', 'promise', 'projection'],
          }),
        createAbsential('uncle-obstacle', 'entropy',
          'Uncle\'s unreliability as entropic force', {
            origin: { seq: 4, chapter: 1 },
            pressure: 0.2, direction: 'away',
            affects: [ref('character', 'boy')],
            tags: ['uncle', 'time', 'obstacle', 'bazaar'],
          }),
      ],
    }),
    createEvent('waiting', 'I chafed against school', 5, 5, {
      tags: ['boy', 'bazaar', 'obsession', 'school', 'time', 'enchantment'],
    }),
    createEvent('uncle-late', 'Uncle forgot. Mrs Mercer gossips.', 6, 6, {
      tags: ['uncle', 'time', 'obstacle', 'bazaar', 'frustration', 'dublin', 'paralysis'],
    }),
    createEvent('uncle-arrives', 'Uncle home at nine, drunk', 7, 7, {
      tags: ['uncle', 'bazaar', 'time', 'irony', 'dublin', 'paralysis'],
    }),
    createEvent('journey', 'Deserted train, ruinous houses', 8, 8, {
      tags: ['bazaar', 'journey', 'desolation', 'dublin', 'boy'],
    }),
    createEvent('arrival', 'Nearly all stalls closed. Darkness.', 9, 9, {
      tags: ['bazaar', 'darkness', 'commerce', 'church', 'disillusion', 'silence'],
      resolves: ['bazaar-quest'],
    }),
    createEvent('flirtation', 'O, I never said such a thing!', 10, 10, {
      tags: ['bazaar', 'commerce', 'flirtation', 'banality', 'mirror', 'girl', 'vanity'],
    }),
    createEvent('epiphany', 'Gazing up into the darkness I saw myself driven and derided by vanity', 11, 11, {
      tags: ['boy', 'vanity', 'self-deception', 'epiphany', 'darkness', 'anguish', 'disillusion', 'paralysis'],
      resolves: ['romantic-projection', 'self-deception', 'isolation-intensity'],
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'Dark closing bazaar', necessity: 0.7 },
        { frame: 'diegetic-intentional', references: [], description: 'Boy recognizes gap', necessity: 0.9 },
        { frame: 'structural', references: [], description: 'Bildungsroman requires disillusionment', necessity: 0.8 },
        { frame: 'thematic', references: [], description: 'Vanity must be exposed', necessity: 0.95 },
        { frame: 'authorial', references: [], description: 'Joyce: every Dubliners story = paralysis', necessity: 1.0 },
        { frame: 'intertextual', references: [], description: 'Grail quest inverted', necessity: 0.7 },
        { frame: 'cultural', references: [], description: 'Colonial escape fantasy collapses', necessity: 0.6 },
      ],
    }),
  ]

  return { state, events, name: 'Araby' }
}

// ═══════════════════════════════════════════════════════════════════
//  STORY 2: FELLOWSHIP
// ═══════════════════════════════════════════════════════════════════

function buildFellowship() {
  const state = createInitialState({ value: 3001 })

  state.absentials.push(
    createAbsential('ring-corruption', 'constraint',
      'The One Ring corrupts its bearer', {
        pressure: 0.3, direction: 'toward',
        affects: [ref('character', 'frodo')],
        visibility: 'latent', tags: ['ring', 'corruption', 'power'],
      }),
    createAbsential('sauron-rising', 'attractor',
      'Sauron regathering power', {
        pressure: 0.2, direction: 'toward',
        affects: [ref('object', 'one-ring')],
        visibility: 'latent', tags: ['sauron', 'ring', 'war'],
      }),
    createAbsential('quest-to-mordor', 'attractor',
      'The Ring must reach Mount Doom', {
        pressure: 0.1, direction: 'toward',
        affects: [ref('character', 'frodo')],
        visibility: 'latent', tags: ['ring', 'quest', 'mount-doom'],
      }),
    createAbsential('aragorns-kingship', 'potential',
      "Aragorn's unclaimed throne", {
        pressure: 0.2, direction: 'toward',
        affects: [ref('character', 'aragorn')],
        visibility: 'latent', tags: ['aragorn', 'kingship', 'gondor'],
      }),
    createAbsential('boromir-weakness', 'tension',
      "Boromir's desire to use the Ring", {
        pressure: 0.1, direction: 'toward',
        affects: [ref('character', 'boromir')],
        visibility: 'latent', tags: ['boromir', 'ring', 'corruption', 'gondor'],
      }),
  )

  const events = [
    createEvent('bilbo-vanishes', 'Bilbo vanishes at his party', 1, 3001, {
      tags: ['bilbo', 'ring', 'shire'],
    }),
    createEvent('gandalf-confronts', 'Gandalf confronts Bilbo about the Ring', 2, 3001, {
      tags: ['gandalf', 'bilbo', 'ring', 'corruption'],
    }),
    createEvent('seventeen-years', 'Seventeen years pass', 3, 3018, {
      tags: ['frodo', 'shire', 'time-passage'],
    }),
    createEvent('ring-revealed', 'Gandalf reveals the Ring is the One Ring', 4, 3018, {
      tags: ['gandalf', 'frodo', 'ring', 'sauron', 'history', 'corruption', 'quest'],
    }),
    createEvent('riders-abroad', 'Nazgûl searching for the Ring', 5, 3018, {
      tags: ['frodo', 'ring', 'sauron', 'nazgul', 'shire', 'quest'],
    }),
    createEvent('council-of-elrond', 'All knowledge converges', 6, 3018, {
      tags: ['council', 'ring', 'quest', 'fellowship', 'aragorn', 'boromir', 'gandalf', 'frodo'],
    }),
    createEvent('entering-moria', 'Fellowship enters Moria', 7, 3019, {
      tags: ['moria', 'fellowship', 'gandalf', 'danger'],
    }),
    createEvent('gandalf-falls', 'Gandalf faces the Balrog. He falls.', 8, 3019, {
      tags: ['gandalf', 'balrog', 'moria', 'fellowship', 'sacrifice', 'loss'],
      introduces: [
        createAbsential('gandalf-absence', 'absence',
          'Gandalf is gone — guide and protector lost', {
            origin: { seq: 8, chapter: 5 },
            pressure: 0.8, direction: 'away',
            affects: [ref('character', 'frodo'), ref('character', 'aragorn')],
            visibility: 'manifest', tags: ['gandalf', 'loss', 'guidance', 'fellowship'],
          }),
      ],
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'Balrog pulled him', necessity: 1.0 },
        { frame: 'diegetic-intentional', references: [], description: 'Gandalf chose to face it', necessity: 1.0 },
        { frame: 'structural', references: [], description: 'Mentor must die for hero maturation', necessity: 0.9 },
        { frame: 'thematic', references: [], description: 'Sacrifice as fellowship\'s expression', necessity: 0.8 },
        { frame: 'authorial', references: [], description: 'Tolkien\'s eucatastrophe', necessity: 0.7 },
      ],
    }),
    createEvent('lothlorien-grief', 'Fellowship reaches Lothlórien, grieves', 9, 3019, {
      tags: ['fellowship', 'gandalf', 'loss', 'aragorn', 'guidance', 'grief'],
    }),
    createEvent('boromir-attempts', 'Boromir tries to take the Ring', 10, 3019, {
      tags: ['boromir', 'ring', 'corruption', 'fellowship', 'frodo'],
      resolves: ['boromir-weakness'],
      introduces: [
        createAbsential('fellowship-broken', 'entropy',
          'Fellowship sundered', {
            origin: { seq: 10, chapter: 7 },
            pressure: 0.6, direction: 'away',
            affects: [ref('character', 'frodo'), ref('character', 'aragorn')],
            visibility: 'manifest', tags: ['fellowship', 'separation'],
          }),
      ],
    }),
  ]

  return { state, events, name: 'Fellowship of the Ring' }
}

// ═══════════════════════════════════════════════════════════════════
//  STORY 3: MYSTERY
// ═══════════════════════════════════════════════════════════════════

function buildMystery() {
  const state = createInitialState({ value: 1 })

  state.absentials.push(
    createAbsential('whodunit', 'secret', 'Who killed Lord Ashworth?', {
      pressure: 0.9, tags: ['murder', 'killer'],
    }),
    createAbsential('howdunit', 'secret', 'How in a locked room?', {
      pressure: 0.7, tags: ['murder', 'method', 'room'],
    }),
    createAbsential('whydunit', 'secret', 'What was the motive?', {
      pressure: 0.5, tags: ['murder', 'motive'],
    }),
  )

  const events = [
    createEvent('body-found', 'Lord Ashworth found dead in locked study', 1, 1, {
      tags: ['murder', 'room', 'victim'],
    }),
    createEvent('butler-suspicious', 'Butler near the study, no alibi', 2, 1, {
      tags: ['butler', 'murder', 'suspect'],
    }),
    createEvent('poison-discovered', 'Autopsy: poison, not stab wound', 3, 2, {
      tags: ['murder', 'method', 'poison'],
    }),
    createEvent('wife-affair-clue', 'Love letters found — affair motive', 4, 2, {
      tags: ['wife', 'motive', 'murder'],
    }),
    createEvent('hidden-passage', 'Hidden passage behind bookcase', 5, 3, {
      tags: ['room', 'method', 'murder'],
      resolves: ['howdunit'],
    }),
    createEvent('confrontation', 'Mrs Ashworth confesses', 6, 3, {
      tags: ['wife', 'murder', 'killer', 'motive', 'confession'],
      resolves: ['whodunit', 'whydunit'],
    }),
  ]

  return { state, events, name: 'The Locked Room (Mystery)' }
}

// ═══════════════════════════════════════════════════════════════════
//  ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeStory(build: () => { state: NarrativeState; events: NarrativeEvent[]; name: string }) {
  const { state, events, name } = build()
  const history = replay(state, events)

  const points: Array<{ seq: number; label: string; scalarTension: number; complex: ComplexTensionResult }> = []

  for (const { event, state: s } of history) {
    const ct = computeComplexTension(s)
    points.push({
      seq: event.discourse.seq,
      label: event.id,
      scalarTension: s.tension,
      complex: ct,
    })
  }

  return { name, history, events, points }
}

// ─── Run ────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════')
console.log('  COMPLEX TENSION ANALYSIS — Three Stories Compared')
console.log('  Hypothesis: tension phase encodes narrative quality/texture')
console.log('═══════════════════════════════════════════════════════════════════\n')

const stories = [buildAraby, buildFellowship, buildMystery].map(analyzeStory)

for (const story of stories) {
  console.log(`\n${'═'.repeat(65)}`)
  console.log(`  ${story.name}`)
  console.log('═'.repeat(65))

  // Scalar vs Complex comparison table
  console.log('\n── Scalar vs Complex Tension ──\n')
  console.log(printComplexTensionTable(story.points))

  // Trajectory plot
  console.log('\n── Complex Plane Trajectory ──\n')
  console.log(plotTrajectory(
    story.points.map(p => ({ seq: p.seq, label: p.label, tension: p.complex })),
    60, 25,
  ))
  console.log()
}

// ─── Cross-Story Phase Comparison ───────────────────────────────────

console.log('\n' + '═'.repeat(65))
console.log('  CROSS-STORY PHASE COMPARISON')
console.log('═'.repeat(65))
console.log()

// Compare key moments across stories
const keyMoments = [
  { story: 'Araby', label: 'Epiphany', points: stories[0].points, idx: stories[0].points.length - 1 },
  { story: 'Fellowship', label: "Gandalf's Fall", points: stories[1].points, idx: 7 },
  { story: 'Fellowship', label: "Boromir's Betrayal", points: stories[1].points, idx: 9 },
  { story: 'Mystery', label: 'Body Found', points: stories[2].points, idx: 0 },
  { story: 'Mystery', label: 'Confession', points: stories[2].points, idx: stories[2].points.length - 1 },
]

console.log('  Key Moments — Phase Signatures:')
console.log('  ' + '─'.repeat(80))
for (const m of keyMoments) {
  const p = m.points[m.idx]
  const c = p.complex
  console.log(`  ${m.story.padEnd(12)} ${m.label.padEnd(22)} |T|=${c.magnitude.toFixed(3)}  φ=${c.phaseDeg.toFixed(1).padStart(7)}°  interf=${c.interference.toFixed(3)}  ${interpretPhase(c.phaseDeg).slice(0, 35)}`)
}

// ─── Interference Analysis ──────────────────────────────────────────

console.log('\n── Interference Patterns ──')
console.log('  (interference = |vector sum| / sum of |magnitudes|)')
console.log('  1.0 = all forces aligned, 0.0 = perfect cancellation\n')

for (const story of stories) {
  const avgInterference = story.points.reduce((s, p) => s + p.complex.interference, 0) / story.points.length
  const minInterference = Math.min(...story.points.map(p => p.complex.interference))
  const maxInterference = Math.max(...story.points.map(p => p.complex.interference))
  console.log(`  ${story.name.padEnd(25)} avg=${avgInterference.toFixed(3)}  min=${minInterference.toFixed(3)}  max=${maxInterference.toFixed(3)}`)
}

// ─── Complex Commutator Comparison ──────────────────────────────────

console.log('\n' + '═'.repeat(65))
console.log('  COMPLEX COMMUTATOR — Key Events')
console.log('═'.repeat(65))
console.log()

// Araby epiphany
const arabyEpiphany = stories[0].events[stories[0].events.length - 1]
const arabyDepth = complexNarrativeDepth(arabyEpiphany)
console.log(`  Araby Epiphany: |depth|=${arabyDepth.magnitude.toFixed(4)} (re=${arabyDepth.realPart.toFixed(4)}, im=${arabyDepth.imaginaryPart.toFixed(4)})`)

const arabyMatrix = complexCommutatorMatrix(arabyEpiphany)
for (const r of arabyMatrix) {
  if (r.magnitude > 0.01) {
    console.log(`    ${r.frameA} × ${r.frameB}: |G|=${r.magnitude.toFixed(4)} (re=${r.realPart.toFixed(4)}, im=${r.imaginaryPart.toFixed(4)}) — ${r.interpretation}`)
  }
}

// Gandalf's fall
const gandalfFall = stories[1].events[7]
const gandalfDepth = complexNarrativeDepth(gandalfFall)
console.log(`\n  Gandalf's Fall: |depth|=${gandalfDepth.magnitude.toFixed(4)} (re=${gandalfDepth.realPart.toFixed(4)}, im=${gandalfDepth.imaginaryPart.toFixed(4)})`)

const gandalfMatrix = complexCommutatorMatrix(gandalfFall)
for (const r of gandalfMatrix) {
  if (r.magnitude > 0.01) {
    console.log(`    ${r.frameA} × ${r.frameB}: |G|=${r.magnitude.toFixed(4)} (re=${r.realPart.toFixed(4)}, im=${r.imaginaryPart.toFixed(4)}) — ${r.interpretation}`)
  }
}

// ─── The Key Question ───────────────────────────────────────────────

console.log('\n' + '═'.repeat(65))
console.log('  THE KEY QUESTION: Does phase mean something?')
console.log('═'.repeat(65))
console.log()

const arabyFinal = stories[0].points[stories[0].points.length - 1]
const gandalfPoint = stories[1].points[7]
const mysteryStart = stories[2].points[0]
const mysteryEnd = stories[2].points[stories[2].points.length - 1]

console.log('  Araby\'s epiphany:     phase =', arabyFinal.complex.phaseDeg.toFixed(1) + '° →', interpretPhase(arabyFinal.complex.phaseDeg))
console.log('  Gandalf\'s fall:       phase =', gandalfPoint.complex.phaseDeg.toFixed(1) + '° →', interpretPhase(gandalfPoint.complex.phaseDeg))
console.log('  Mystery (start):      phase =', mysteryStart.complex.phaseDeg.toFixed(1) + '° →', interpretPhase(mysteryStart.complex.phaseDeg))
console.log('  Mystery (resolved):   phase =', mysteryEnd.complex.phaseDeg.toFixed(1) + '° →', interpretPhase(mysteryEnd.complex.phaseDeg))

console.log()

// Verdict
const arabyPhase = arabyFinal.complex.phaseDeg
const gandalfPhase = gandalfPoint.complex.phaseDeg
const phaseDiff = Math.abs(arabyPhase - gandalfPhase)

if (phaseDiff > 30) {
  console.log('  ✓ DIFFERENT PHASE SIGNATURES. The epiphany and the fall have')
  console.log(`    genuinely different qualities (Δφ = ${phaseDiff.toFixed(1)}°).`)
  console.log('    Complex tension captures something the scalar missed.')
} else {
  console.log('  ~ SIMILAR PHASES. The scalar tension may have been sufficient.')
  console.log(`    Phase difference is only ${phaseDiff.toFixed(1)}°.`)
}

console.log()

// Interference verdict
const arabyInterf = arabyFinal.complex.interference
const gandalfInterf = gandalfPoint.complex.interference
console.log(`  Araby interference:     ${arabyInterf.toFixed(3)}`)
console.log(`  Fellowship interference: ${gandalfInterf.toFixed(3)}`)
if (Math.abs(arabyInterf - gandalfInterf) > 0.1) {
  console.log('  ✓ Different interference patterns — narrative forces align differently.')
} else {
  console.log('  ~ Similar interference — forces align similarly despite different stories.')
}

console.log()
console.log('  Complex commutator imaginary part:')
console.log(`    Araby: im=${arabyDepth.imaginaryPart.toFixed(4)} — ${arabyDepth.imaginaryPart > 0.01 ? '✓ register interference detected' : '~ minimal interference'}`)
console.log(`    Fellowship: im=${gandalfDepth.imaginaryPart.toFixed(4)} — ${gandalfDepth.imaginaryPart > 0.01 ? '✓ register interference detected' : '~ minimal interference'}`)

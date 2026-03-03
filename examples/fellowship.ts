/**
 * Example: The Fellowship of the Ring (opening sequence)
 * 
 * Demonstrates dual temporality, absential dynamics, and 
 * how narrative state evolves through events.
 */

import { 
  createInitialState, 
  createAbsential, 
  createEvent, 
  reduce 
} from '../src/reducer.js'
import type { NarrativeState } from '../src/types.js'

// ─── Initial State ──────────────────────────────────────────────────

const state = createInitialState({ t: 3001, label: 'Third Age 3001 — Bilbo\'s Party' })

// Set up characters
state.diegetic.characters = {
  frodo: { location: 'Bag End', status: 'content', alive: true },
  gandalf: { location: 'Bag End', status: 'watchful', alive: true },
  bilbo: { location: 'Bag End', status: 'restless', alive: true },
}

// Reader starts knowing nothing
state.extradiegetic.readerKnows = {
  'ring-is-one-ring': false,
  'sauron-returning': false,
  'bilbo-leaving': false,
}

// ─── Absential Dynamics (pre-existing) ──────────────────────────────

// The Ring's corruption — a constraint that's been active since Bilbo found it,
// but the reader doesn't know yet. This is extradiegetic absence.
state.absentials.push(
  createAbsential('ring-corruption', 'constraint', 
    'The One Ring corrupts its bearer, extending life but eroding will', {
    pressure: 0.3,  // Low at start — Bilbo has resisted well
    scope: ['bilbo', 'ring'],
    tags: ['ring', 'corruption', 'power']
  }),
  
  createAbsential('sauron-rising', 'attractor',
    'Sauron is regathering power and seeking the Ring', {
    pressure: 0.2,  // Distant but pulling
    scope: ['ring', 'middle-earth'],
    tags: ['sauron', 'ring', 'war']
  }),
  
  createAbsential('bilbo-departure', 'potential',
    'Bilbo intends to leave the Shire', {
    pressure: 0.8,  // Imminent
    scope: ['bilbo', 'frodo'],
    tags: ['bilbo', 'departure', 'shire']
  })
)

// ─── Events ─────────────────────────────────────────────────────────

const events = [
  // Event 1: Bilbo's party and disappearance
  // Sjuzhet pos 1, fabula time 3001
  createEvent('bilbo-vanishes', 
    'Bilbo puts on the Ring and vanishes at his 111th birthday party',
    1, 3001, {
    fabula: { t: 3001, label: 'Bilbo\'s 111th birthday' },
    sjuzhet: { position: 1, ref: 'Chapter 1: A Long-Expected Party' },
    focalizer: 'frodo',
    tags: ['bilbo', 'ring', 'departure', 'shire']
  }),
  
  // Event 2: Gandalf confronts Bilbo about the Ring
  // Still sjuzhet pos 2, same fabula time
  createEvent('gandalf-confronts-bilbo',
    'Gandalf pressures Bilbo to leave the Ring behind. Bilbo calls it "my precious" and Gandalf\'s alarm is visible.',
    2, 3001, {
    sjuzhet: { position: 2, ref: 'Chapter 1' },
    focalizer: 'gandalf',  // Shifts to Gandalf's perspective
    tags: ['gandalf', 'bilbo', 'ring', 'corruption', 'departure']
  }),
  
  // Event 3: 17 years pass (compressed fabula time, single sjuzhet moment)
  createEvent('seventeen-years',
    'Seventeen years pass. Frodo lives quietly in Bag End. Gandalf visits rarely.',
    3, 3018, {
    sjuzhet: { position: 3, ref: 'Chapter 2: The Shadow of the Past' },
    fabula: { t: 3018, label: 'Third Age 3018' },
    tags: ['frodo', 'shire', 'time-passage']
  }),
  
  // Event 4: Gandalf reveals the Ring's history
  // CRITICAL: sjuzhet pos 4, but fabula time reaches back thousands of years
  // This is where dual temporality becomes load-bearing
  createEvent('ring-history-revealed',
    'Gandalf tells Frodo the history of the One Ring: forged by Sauron, lost by Isildur, found by Gollum, taken by Bilbo. The Ring must be destroyed.',
    4, 3018, {
    sjuzhet: { position: 4, ref: 'Chapter 2: The Shadow of the Past' },
    fabula: { t: 3018, label: 'Gandalf\'s revelation' },
    focalizer: 'frodo',
    tags: ['gandalf', 'frodo', 'ring', 'sauron', 'history', 'corruption', 'war']
  }),
  
  // Event 5: The Black Riders are abroad
  createEvent('riders-abroad',
    'Gandalf warns that the Nazgûl are searching for the Ring. Frodo must leave the Shire.',
    5, 3018, {
    sjuzhet: { position: 5, ref: 'Chapter 2' },
    focalizer: 'frodo',
    tags: ['gandalf', 'frodo', 'ring', 'sauron', 'nazgul', 'departure', 'shire']
  }),
]

// ─── Reduce ─────────────────────────────────────────────────────────

console.log('=== Narrative Telemetry: Fellowship Opening ===\n')

let current = state
const spans = []

for (const event of events) {
  const result = reduce(current, event)
  spans.push(result.span)
  current = result.state
  
  console.log(`[${event.sjuzhet.ref || 'pos ' + event.sjuzhet.position}]`)
  console.log(`  Event: ${event.description.slice(0, 80)}...`)
  console.log(`  Fabula: ${event.fabula.label || 't=' + event.fabula.t}`)
  console.log(`  Absential interactions:`)
  
  if (result.span.absentialInteractions.length === 0) {
    console.log(`    (none)`)
  }
  
  for (const interaction of result.span.absentialInteractions) {
    const abs = current.absentials.find(a => a.id === interaction.absentialId)
    console.log(`    ${interaction.effect}: "${abs?.description?.slice(0, 60)}..." (pressure: ${abs?.pressure.toFixed(2)})`)
  }
  console.log()
}

console.log('=== Final Absential Field ===\n')
for (const abs of current.absentials) {
  console.log(`  [${abs.kind}] ${abs.description.slice(0, 60)}`)
  console.log(`    pressure: ${abs.pressure.toFixed(2)} | scope: ${abs.scope.join(', ')}`)
  console.log(`    ${abs.resolved ? 'RESOLVED' : 'ACTIVE'}`)
  console.log()
}

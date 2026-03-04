import { describe, it, expect } from 'vitest'
import { reviseBeliefs } from '../src/belief-revision.js'
import { createInitialState, createFact, knowerIdToString } from '../src/reducer.js'
import type { KnowerId, Stance, Lens } from '../src/types.js'

describe('Belief Revision', () => {
  it('collapses beliefs when fact truth changes', () => {
    const state = createInitialState()
    const fact = createFact('ring-safe', 'The Ring is safe to use', { truth: 'true' })
    state.facts.set(fact.id, fact)

    const frodo: KnowerId = { type: 'character', id: 'frodo' }
    const lid = knowerIdToString(frodo)
    const lens: Lens = {
      id: lid, knower: frodo,
      stances: new Map([['ring-safe', [{
        status: 'believed-true', mode: 'epistemic', confidence: 0.8,
        justification: { kind: 'testimony', sources: [{ entityId: 'gandalf', reliability: 0.9 }] },
        acquired: { seq: 1, chapter: 1 },
      }]]]),
    }
    state.lenses.set(lid, lens)

    const result = reviseBeliefs(state,
      { kind: 'fact-truth-change', factId: 'ring-safe', newTruth: 'false' },
      { seq: 5, chapter: 3 })

    expect(result.affected.length).toBe(1)
    expect(result.affected[0].newStance.status).toBe('believed-false')
    expect(result.affected[0].newStance.confidence).toBeLessThan(0.8)
  })

  it('cascades when source becomes unreliable', () => {
    const state = createInitialState()
    const fact = createFact('ring-identity', 'The Ring is the One Ring')
    state.facts.set(fact.id, fact)

    const frodo: KnowerId = { type: 'character', id: 'frodo' }
    const lid = knowerIdToString(frodo)
    state.lenses.set(lid, {
      id: lid, knower: frodo,
      stances: new Map([['ring-identity', [{
        status: 'believed-true', mode: 'epistemic', confidence: 0.85,
        justification: { kind: 'testimony', sources: [
          { entityId: 'gandalf', description: 'Gandalf told me', reliability: 0.95 }
        ]},
        acquired: { seq: 4, chapter: 2 },
      }]]]),
    })

    // What if Gandalf turned out to be unreliable?
    const result = reviseBeliefs(state,
      { kind: 'source-unreliable', entityId: 'gandalf', newReliability: 0.1 },
      { seq: 10, chapter: 5 })

    expect(result.affected.length).toBe(1)
    expect(result.affected[0].newStance.confidence).toBeLessThan(0.5)
  })

  it('preserves beliefs with independent corroborating sources', () => {
    const state = createInitialState()
    const fact = createFact('ring-identity', 'The Ring is the One Ring')
    state.facts.set(fact.id, fact)

    const gandalf: KnowerId = { type: 'character', id: 'gandalf' }
    const lid = knowerIdToString(gandalf)
    state.lenses.set(lid, {
      id: lid, knower: gandalf,
      stances: new Map([['ring-identity', [{
        status: 'known-true', mode: 'epistemic', confidence: 0.99,
        justification: { kind: 'inference', sources: [
          { factId: 'inscription', description: 'Saw the inscription', reliability: 1.0 },
          { factId: 'aging', description: 'Bilbo doesnt age', reliability: 0.9 },
          { entityId: 'gollum', description: 'Gollum testimony', reliability: 0.5 },
        ]},
        acquired: { seq: 4, chapter: 2 },
      }]]]),
    })

    // Gollum becomes unreliable — but Gandalf has other sources
    const result = reviseBeliefs(state,
      { kind: 'source-unreliable', entityId: 'gollum', newReliability: 0.0 },
      { seq: 10, chapter: 5 })

    // Should be affected but not dramatically — only 1/3 sources compromised
    if (result.affected.length > 0) {
      expect(result.affected[0].newStance.confidence).toBeGreaterThan(0.5)
    }
  })
})

import { describe, it, expect } from 'vitest'
import { computeCommutator, narrativeDepth, commutatorMatrix } from '../src/commutator.js'
import { createEvent } from '../src/reducer.js'
import type { EntityRef } from '../src/types.js'

function ref(type: EntityRef['type'], id: string): EntityRef {
  return { type, id }
}

describe('Groovy Commutator', () => {
  it('returns 0 for event with single frame', () => {
    const event = createEvent('e1', 'simple event', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'physics', necessity: 1.0 },
      ],
    })
    expect(narrativeDepth(event)).toBe(0)
  })

  it('same-register frames commute', () => {
    const event = createEvent('e1', 'event', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'physics', necessity: 1.0 },
        { frame: 'diegetic-intentional', references: [], description: 'choice', necessity: 1.0 },
      ],
    })
    const result = computeCommutator(event, 'diegetic-mechanical', 'diegetic-intentional')
    expect(result.commutator).toBe(0)
  })

  it('cross-register frames show non-commutativity when necessity differs', () => {
    const event = createEvent('e1', 'event', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'physics', necessity: 1.0 },
        { frame: 'authorial', references: [], description: 'author needed it', necessity: 0.5 },
      ],
    })
    const result = computeCommutator(event, 'diegetic-mechanical', 'authorial')
    expect(result.commutator).toBeGreaterThan(0)
  })

  it('more causal frames = higher potential depth', () => {
    const simple = createEvent('e1', 'simple', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'x', necessity: 1.0 },
        { frame: 'structural', references: [], description: 'y', necessity: 0.8 },
      ],
    })
    const complex = createEvent('e2', 'complex', 2, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'x', necessity: 1.0 },
        { frame: 'diegetic-intentional', references: [], description: 'y', necessity: 0.9 },
        { frame: 'structural', references: [], description: 'z', necessity: 0.7 },
        { frame: 'thematic', references: [], description: 'w', necessity: 0.6 },
        { frame: 'authorial', references: [], description: 'v', necessity: 0.4 },
      ],
    })
    expect(commutatorMatrix(complex).length).toBeGreaterThan(commutatorMatrix(simple).length)
  })

  it('event with max disparity has highest commutator', () => {
    // One frame fully necessary, one frame barely necessary
    const event = createEvent('e1', 'event', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'total cause', necessity: 1.0 },
        { frame: 'authorial', references: [], description: 'barely relevant', necessity: 0.1 },
      ],
    })
    const result = computeCommutator(event, 'diegetic-mechanical', 'authorial')
    expect(result.commutator).toBeGreaterThan(0.1)
  })
})

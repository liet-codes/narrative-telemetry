import { describe, it, expect } from 'vitest'
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
  Stance,
  KnowerId,
} from '../src/types.js'

describe('Core Reducer', () => {
  it('advances temporal position', () => {
    const state = createInitialState({ value: 3001, label: 'Third Age 3001' })
    const event = createEvent('e1', 'Something happens', 1, 3001, {
      discourse: { seq: 1, chapter: 1 },
      diegetic: { value: 3001, precision: 'exact' },
    })
    const { state: next } = reduce(state, event)
    expect(next.discourse.seq).toBe(1)
  })

  it('intensifies relevant absentials', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('ring-corruption', 'constraint', 'Ring corrupts bearer', {
        pressure: 0.3,
        tags: ['ring', 'corruption'],
      })
    )
    const event = createEvent('e1', 'Ring tempts Frodo', 1, 3018, {
      tags: ['ring', 'corruption', 'frodo'],
    })
    const { state: next } = reduce(state, event)
    const abs = next.absentials.find(a => a.id === 'ring-corruption')!
    expect(abs.pressure).toBeGreaterThan(0.3)
  })

  it('resolves absentials when event resolves them', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('ring-destruction', 'constraint', 'Ring must be destroyed', {
        pressure: 0.9,
        tags: ['ring'],
      })
    )
    const event = createEvent('e1', 'Ring destroyed in Mount Doom', 1, 3019, {
      tags: ['ring', 'mount-doom'],
      resolves: ['ring-destruction'],
    })
    const { state: next } = reduce(state, event)
    const abs = next.absentials.find(a => a.id === 'ring-destruction')!
    expect(abs.resolution).toBeTruthy()
    expect(abs.pressure).toBe(0)
  })

  it('introduces new absentials from events', () => {
    const state = createInitialState()
    const newAbs = createAbsential('gandalf-absence', 'absence', 'Gandalf is gone', {
      pressure: 0.7,
      tags: ['gandalf', 'loss'],
    })
    const event = createEvent('e1', 'Gandalf falls in Moria', 1, 3019, {
      tags: ['gandalf', 'balrog', 'moria'],
      introduces: [newAbs],
    })
    const { state: next } = reduce(state, event)
    expect(next.absentials.find(a => a.id === 'gandalf-absence')).toBeTruthy()
  })
})

describe('Tension Computation', () => {
  it('returns 0 for no absentials', () => {
    const state = createInitialState()
    expect(computeTension(state)).toBe(0)
  })

  it('computes RMS of active absential pressures', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('a1', 'constraint', 'x', { pressure: 0.6 }),
      createAbsential('a2', 'attractor', 'y', { pressure: 0.8 }),
    )
    const t = computeTension(state)
    expect(t).toBeCloseTo(0.707, 2)
  })

  it('ignores resolved absentials', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('a1', 'constraint', 'x', { pressure: 0.9, resolution: { seq: 5, chapter: 1 } }),
    )
    expect(computeTension(state)).toBe(0)
  })
})

describe('Epistemic Events', () => {
  it('applies epistemic events to lenses', () => {
    const state = createInitialState()
    const fact = createFact('ring-is-one-ring', 'The ring is the One Ring', {
      domain: ['ring', 'sauron'],
    })
    state.facts.set(fact.id, fact)

    const frodo: KnowerId = { type: 'character', id: 'frodo' }
    const stance: Stance = {
      status: 'believed-true',
      mode: 'epistemic',
      confidence: 0.85,
      justification: { kind: 'testimony', sources: [{ entityId: 'gandalf', reliability: 0.95 }] },
      acquired: { seq: 4, chapter: 2 },
    }

    const event = createEvent('reveal', 'Gandalf reveals Ring history', 4, 3018, {
      tags: ['ring', 'history'],
      epistemicEffects: [{
        who: frodo,
        fact: 'ring-is-one-ring',
        from: null,
        to: stance,
        trigger: 'reveal',
        discourse: { seq: 4, chapter: 2 },
      }],
    })

    const { state: next } = reduce(state, event)
    const lens = next.lenses.get(knowerIdToString(frodo))
    expect(lens).toBeTruthy()
    const stances = lens!.stances.get('ring-is-one-ring')!
    expect(stances.length).toBe(1)
    expect(stances[0].status).toBe('believed-true')
  })
})

describe('Epistemic Gap Detection', () => {
  it('detects dramatic irony', () => {
    const state = createInitialState()
    const fact = createFact('gandalf-will-return', 'Gandalf will return')
    state.facts.set(fact.id, fact)

    const reReaderLens = {
      id: 'reader:re-reader',
      knower: { type: 'reader' as const, id: 're-reader' },
      stances: new Map([
        ['gandalf-will-return', [{
          status: 'known-true' as const,
          mode: 'epistemic' as const,
          confidence: 1.0,
          justification: { kind: 'reader-inference' as const, sources: [] },
          acquired: { seq: 0, chapter: 1 },
        }]],
      ]),
    }
    state.lenses.set('reader:re-reader', reReaderLens)

    const frodoLens = {
      id: 'character:frodo',
      knower: { type: 'character' as const, id: 'frodo' },
      stances: new Map([
        ['gandalf-will-return', [{
          status: 'unknown' as const,
          mode: 'epistemic' as const,
          confidence: 0,
          justification: { kind: 'direct-observation' as const, sources: [] },
          acquired: { seq: 10, chapter: 5 },
        }]],
      ]),
    }
    state.lenses.set('character:frodo', frodoLens)

    const gaps = detectEpistemicGaps(state)
    expect(gaps.length).toBe(1)
    expect(gaps[0].effect).toBe('dramatic-irony')
  })
})

describe('Retroactive Insertion', () => {
  it('changes tension history when absential inserted retroactively', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('ring-constraint', 'constraint', 'Ring must be destroyed', {
        pressure: 0.5,
        tags: ['ring'],
      })
    )

    const events = [
      createEvent('e1', 'Fellowship forms', 1, 3018, { tags: ['fellowship', 'ring'] }),
      createEvent('e2', 'Journey begins', 2, 3018, { tags: ['journey'] }),
      createEvent('e3', 'Moria entered', 3, 3019, { tags: ['moria', 'gandalf'] }),
    ]

    const protectivePresence = createAbsential(
      'gandalf-protection', 'constraint',
      'Gandalf shields the Fellowship from despair',
      { pressure: 0.4, tags: ['gandalf', 'fellowship'], visibility: 'retrospective' }
    )

    const { diffs, newHistory, oldHistory } = retroactiveInsert(state, events, protectivePresence, 1)
    expect(diffs.length).toBe(3)
    // New history has more active absentials
    const lastNew = newHistory[newHistory.length - 1].state
    const lastOld = oldHistory[oldHistory.length - 1].state
    expect(lastNew.absentials.length).toBeGreaterThan(lastOld.absentials.length)
  })
})

describe('Kind-specific reducers', () => {
  it('entropy increases monotonically', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('fellowship-entropy', 'entropy', 'Fellowship fragmenting', {
        pressure: 0.2,
        tags: ['fellowship'],
      })
    )

    const e1 = createEvent('e1', 'Disagreement', 1, 3018, { tags: ['fellowship'] })
    const { state: s1 } = reduce(state, e1)
    const e2 = createEvent('e2', 'More disagreement', 2, 3018, { tags: ['fellowship'] })
    const { state: s2 } = reduce(s1, e2)

    const p0 = state.absentials[0].pressure
    const p1 = s1.absentials.find(a => a.id === 'fellowship-entropy')!.pressure
    const p2 = s2.absentials.find(a => a.id === 'fellowship-entropy')!.pressure

    expect(p1).toBeGreaterThan(p0)
    expect(p2).toBeGreaterThan(p1)
  })

  it('absence deepens when the missing thing is needed', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('gandalf-gone', 'absence', 'Gandalf is gone', {
        pressure: 0.5,
        tags: ['gandalf', 'guidance'],
      })
    )
    const event = createEvent('e1', 'Fellowship needs guidance', 1, 3019, {
      tags: ['guidance', 'lost'],
    })
    const { state: next } = reduce(state, event)
    const abs = next.absentials.find(a => a.id === 'gandalf-gone')!
    expect(abs.pressure).toBeGreaterThan(0.5)
  })
})

describe('Latent absential activation', () => {
  it('activates latent absentials when relevant knowledge arrives', () => {
    const state = createInitialState()
    const fact = createFact('ring-danger', 'The Ring is supremely dangerous', {
      domain: ['ring', 'danger'],
    })
    state.facts.set(fact.id, fact)

    state.absentials.push(
      createAbsential('ring-threat', 'constraint', 'Ring threatens all', {
        pressure: 0.5,
        tags: ['ring', 'danger'],
        visibility: 'latent',
      })
    )

    const frodo: KnowerId = { type: 'character', id: 'frodo' }
    const event = createEvent('reveal', 'Gandalf tells Frodo about the Ring', 1, 3018, {
      tags: ['ring'],
      epistemicEffects: [{
        who: frodo,
        fact: 'ring-danger',
        from: null,
        to: {
          status: 'believed-true',
          mode: 'epistemic',
          confidence: 0.85,
          justification: { kind: 'testimony', sources: [] },
          acquired: { seq: 1, chapter: 1 },
        },
        trigger: 'reveal',
        discourse: { seq: 1, chapter: 1 },
      }],
    })

    const { state: next } = reduce(state, event)
    const abs = next.absentials.find(a => a.id === 'ring-threat')!
    expect(abs.visibility).toBe('manifest')
  })
})

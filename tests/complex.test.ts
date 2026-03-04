import { describe, it, expect } from 'vitest'
import { complex, polar, add, sub, mul, scale, conjugate, magnitude, phase, phaseDeg, sum, rms, ZERO } from '../src/complex.js'
import { computeComplexTension, complexPressure, interpretPhase } from '../src/complex-tension.js'
import { computeComplexCommutator, complexNarrativeDepth } from '../src/complex-commutator.js'
import { createInitialState, createAbsential, createEvent } from '../src/reducer.js'
import type { EntityRef } from '../src/types.js'

function ref(type: EntityRef['type'], id: string): EntityRef { return { type, id } }

describe('Complex numbers', () => {
  it('add', () => {
    const r = add(complex(1, 2), complex(3, 4))
    expect(r.re).toBe(4)
    expect(r.im).toBe(6)
  })

  it('multiply', () => {
    const r = mul(complex(1, 2), complex(3, -1))
    expect(r.re).toBe(5) // 3+2
    expect(r.im).toBe(5) // -1+6
  })

  it('polar construction', () => {
    const c = polar(1, 0)
    expect(c.re).toBeCloseTo(1)
    expect(c.im).toBeCloseTo(0)
    const c2 = polar(1, Math.PI / 2)
    expect(c2.re).toBeCloseTo(0)
    expect(c2.im).toBeCloseTo(1)
  })

  it('magnitude and phase', () => {
    expect(magnitude(complex(3, 4))).toBeCloseTo(5)
    expect(phaseDeg(complex(0, 1))).toBeCloseTo(90)
    expect(phaseDeg(complex(-1, 0))).toBeCloseTo(180)
  })

  it('conjugate', () => {
    const c = conjugate(complex(3, 4))
    expect(c.re).toBe(3)
    expect(c.im).toBe(-4)
  })

  it('sum and rms', () => {
    const values = [complex(1, 0), complex(0, 1), complex(-1, 0)]
    const s = sum(values)
    expect(s.re).toBeCloseTo(0)
    expect(s.im).toBeCloseTo(1)
    expect(rms(values)).toBeCloseTo(1) // all magnitude 1
  })
})

describe('Complex pressure', () => {
  it('attractor has phase 0', () => {
    const abs = createAbsential('a', 'attractor', 'test', { pressure: 0.5 })
    const p = complexPressure(abs)
    expect(p.re).toBeCloseTo(0.5)
    expect(p.im).toBeCloseTo(0)
  })

  it('constraint has phase 270°', () => {
    const abs = createAbsential('a', 'constraint', 'test', { pressure: 0.5 })
    const p = complexPressure(abs)
    expect(p.re).toBeCloseTo(0, 5)
    expect(p.im).toBeCloseTo(-0.5)
  })

  it('absence has phase 180°', () => {
    const abs = createAbsential('a', 'absence', 'test', { pressure: 0.5 })
    const p = complexPressure(abs)
    expect(p.re).toBeCloseTo(-0.5)
    expect(p.im).toBeCloseTo(0, 5)
  })

  it('secret has phase 90°', () => {
    const abs = createAbsential('a', 'secret', 'test', { pressure: 0.5 })
    const p = complexPressure(abs)
    expect(p.re).toBeCloseTo(0, 5)
    expect(p.im).toBeCloseTo(0.5)
  })

  it('direction away flips phase by 180°', () => {
    const abs = createAbsential('a', 'attractor', 'test', { pressure: 0.5, direction: 'away' })
    const p = complexPressure(abs)
    expect(p.re).toBeCloseTo(-0.5)
    expect(p.im).toBeCloseTo(0, 5)
  })
})

describe('Complex tension', () => {
  it('empty state has zero complex tension', () => {
    const state = createInitialState()
    const ct = computeComplexTension(state)
    expect(ct.magnitude).toBe(0)
  })

  it('single absential gives magnitude = pressure', () => {
    const state = createInitialState()
    state.absentials.push(createAbsential('a', 'attractor', 'test', { pressure: 0.5 }))
    const ct = computeComplexTension(state)
    expect(ct.magnitude).toBeCloseTo(0.5)
  })

  it('opposing absentials partially cancel', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('a', 'attractor', 'pull forward', { pressure: 0.5 }),
      createAbsential('b', 'absence', 'pull backward', { pressure: 0.5 }),
    )
    const ct = computeComplexTension(state)
    // attractor=0°, absence=180° → should cancel
    expect(ct.magnitude).toBeCloseTo(0, 1)
    expect(ct.interference).toBeCloseTo(0, 1)
  })

  it('aligned absentials constructively interfere', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('a', 'attractor', 'pull 1', { pressure: 0.5 }),
      createAbsential('b', 'potential', 'pull 2', { pressure: 0.5 }),
    )
    const ct = computeComplexTension(state)
    // Both at 0° → constructive
    expect(ct.magnitude).toBeCloseTo(1.0)
    expect(ct.interference).toBeCloseTo(1.0)
  })

  it('orthogonal absentials give sqrt(2) interference', () => {
    const state = createInitialState()
    state.absentials.push(
      createAbsential('a', 'attractor', 'forward', { pressure: 0.5 }),
      createAbsential('b', 'secret', 'suspense', { pressure: 0.5 }),
    )
    const ct = computeComplexTension(state)
    // 0° and 90° → magnitude = sqrt(0.5² + 0.5²) ≈ 0.707
    expect(ct.magnitude).toBeCloseTo(Math.SQRT2 / 2)
  })
})

describe('Complex commutator', () => {
  it('same-register frames have zero imaginary part', () => {
    const event = createEvent('e', 'test', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'physics', necessity: 1.0 },
        { frame: 'diegetic-intentional', references: [], description: 'choice', necessity: 1.0 },
      ],
    })
    const r = computeComplexCommutator(event, 'diegetic-mechanical', 'diegetic-intentional')
    expect(r.imaginaryPart).toBeCloseTo(0)
  })

  it('cross-register frames produce imaginary component', () => {
    const event = createEvent('e', 'test', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'physics', necessity: 1.0 },
        { frame: 'authorial', references: [], description: 'author needed it', necessity: 0.8 },
      ],
    })
    const r = computeComplexCommutator(event, 'diegetic-mechanical', 'authorial')
    expect(r.imaginaryPart).not.toBeCloseTo(0)
    expect(r.magnitude).toBeGreaterThan(0)
  })

  it('complex depth has real and imaginary components', () => {
    const event = createEvent('e', 'test', 1, 1, {
      causation: [
        { frame: 'diegetic-mechanical', references: [], description: 'x', necessity: 1.0 },
        { frame: 'thematic', references: [], description: 'y', necessity: 0.8 },
        { frame: 'authorial', references: [], description: 'z', necessity: 0.7 },
      ],
    })
    const d = complexNarrativeDepth(event)
    expect(d.magnitude).toBeGreaterThan(0)
  })
})

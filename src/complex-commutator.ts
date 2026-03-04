/**
 * Complex-valued Groovy Commutator.
 * 
 * In quantum mechanics, the commutator [A,B] = AB - BA of Hermitian
 * operators is anti-Hermitian (purely imaginary eigenvalues).
 * 
 * Here: readings become complex. The real part of [A,B] measures
 * interpretive asymmetry (as before). The imaginary part measures
 * something new: the INTERFERENCE between frames — how much
 * foregrounding one frame creates resonance or dissonance with another.
 */

import type { CausalAttribution, CausalFrame, NarrativeEvent } from './types.js'
import { type Complex, complex, sub, magnitude, phase, phaseDeg, mul, conjugate, add, ZERO, toString, toPolar } from './complex.js'

export type ComplexCommutatorResult = {
  event: string
  frameA: CausalFrame
  frameB: CausalFrame
  readingAB: Complex
  readingBA: Complex
  commutator: Complex
  /** Magnitude of the commutator — total non-commutativity */
  magnitude: number
  /** Real part — interpretive asymmetry (same as scalar commutator) */
  realPart: number
  /** Imaginary part — frame interference / resonance */
  imaginaryPart: number
  /** Phase of commutator — WHAT KIND of non-commutativity */
  phase: number
  phaseDeg: number
  interpretation: string
}

/**
 * Compute complex reading: foregrounding frame A, then reading through B.
 * 
 * The reading is complex because:
 * - Real part = explanatory weight (how much this ordering explains)
 * - Imaginary part = interpretive resonance (how much frames harmonize or clash)
 * 
 * Two frames with high necessity but different "registers" (e.g. diegetic vs authorial)
 * produce imaginary components because the register-crossing creates interpretive
 * interference — you can't cleanly separate them.
 */
function computeComplexReading(
  attributions: CausalAttribution[],
  primaryFrame: CausalFrame,
  secondaryFrame: CausalFrame
): Complex {
  const primaryAttrs = attributions.filter(a => a.frame === primaryFrame)
  const secondaryAttrs = attributions.filter(a => a.frame === secondaryFrame)

  const pNecessity = primaryAttrs.length > 0
    ? primaryAttrs.reduce((s, a) => s + a.necessity, 0) / primaryAttrs.length
    : 0
  const sNecessity = secondaryAttrs.length > 0
    ? secondaryAttrs.reduce((s, a) => s + a.necessity, 0) / secondaryAttrs.length
    : 0

  // Real part: same as scalar — explanatory anchoring
  const primaryWeight = Math.pow(pNecessity, 0.7)
  const secondaryWeight = sNecessity * (1 - primaryWeight * 0.5)
  const real = primaryWeight + secondaryWeight * 0.5

  // Imaginary part: register interference
  // When primary has high necessity and secondary is in a different register,
  // the primary ANCHORS interpretation, creating an imaginary component
  // proportional to the anchoring strength × register distance.
  // This is asymmetric: strong primary → large imaginary; weak primary → small.
  const registerDistance = computeRegisterDistance(primaryFrame, secondaryFrame)
  const imaginary = registerDistance * primaryWeight * sNecessity

  return complex(real, imaginary)
}

/** 
 * Register distance: how far apart two causal frames are ontologically.
 * Same register = 0 (commuting), different registers = higher values.
 */
function computeRegisterDistance(a: CausalFrame, b: CausalFrame): number {
  const registers: Record<string, number> = {
    'diegetic-mechanical': 0,
    'diegetic-intentional': 0,
    'structural': 1,
    'thematic': 1.5,
    'authorial': 2,
    'intertextual': 2.5,
    'cultural': 3,
  }
  
  const ra = registers[a] ?? 1
  const rb = registers[b] ?? 1
  return Math.abs(ra - rb) / 3 // Normalize to [0, 1]
}

export function computeComplexCommutator(
  event: NarrativeEvent,
  frameA: CausalFrame,
  frameB: CausalFrame
): ComplexCommutatorResult {
  const attributions = event.causation ?? []

  const readingAB = computeComplexReading(attributions, frameA, frameB)
  const readingBA = computeComplexReading(attributions, frameB, frameA)
  const commutator = sub(readingAB, readingBA)

  const mag = magnitude(commutator)
  const ph = phase(commutator)
  const phDeg = phaseDeg(commutator)

  let interpretation: string
  if (mag < 0.05) {
    interpretation = 'Frames commute — reducible to either'
  } else if (mag < 0.15) {
    interpretation = 'Mild non-commutativity'
  } else if (mag < 0.3) {
    interpretation = 'Significant — ordering changes interpretation'
  } else {
    interpretation = 'Strong non-commutativity — genuine depth'
  }

  // Add phase interpretation
  if (mag > 0.05) {
    const absIm = Math.abs(commutator.im)
    const absRe = Math.abs(commutator.re)
    if (absIm > absRe * 2) {
      interpretation += ' [primarily interference]'
    } else if (absRe > absIm * 2) {
      interpretation += ' [primarily asymmetry]'
    } else {
      interpretation += ' [mixed asymmetry + interference]'
    }
  }

  return {
    event: event.id,
    frameA,
    frameB,
    readingAB,
    readingBA,
    commutator,
    magnitude: mag,
    realPart: commutator.re,
    imaginaryPart: commutator.im,
    phase: ph,
    phaseDeg: phDeg,
    interpretation,
  }
}

export function complexCommutatorMatrix(event: NarrativeEvent): ComplexCommutatorResult[] {
  const frames = [...new Set((event.causation ?? []).map(a => a.frame))]
  const results: ComplexCommutatorResult[] = []
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      results.push(computeComplexCommutator(event, frames[i], frames[j]))
    }
  }
  return results
}

export function complexNarrativeDepth(event: NarrativeEvent): {
  magnitude: number
  realPart: number
  imaginaryPart: number
} {
  const matrix = complexCommutatorMatrix(event)
  if (matrix.length === 0) return { magnitude: 0, realPart: 0, imaginaryPart: 0 }
  const avgMag = matrix.reduce((s, r) => s + r.magnitude, 0) / matrix.length
  const avgRe = matrix.reduce((s, r) => s + r.realPart, 0) / matrix.length
  const avgIm = matrix.reduce((s, r) => s + r.imaginaryPart, 0) / matrix.length
  return { magnitude: avgMag, realPart: avgRe, imaginaryPart: avgIm }
}

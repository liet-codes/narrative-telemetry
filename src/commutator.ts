/**
 * The Groovy Commutator — applied to narrative causal frames.
 * 
 * Core idea: Take an event with overdetermined causation.
 * Apply "explain via frame A first" then "read through frame B" — reading AB.
 * Reverse — reading BA.
 * 
 * Non-commutativity arises when two frames BOTH claim high necessity
 * (overdetermined causation) — the one you foreground first changes
 * how you read the other.
 * 
 * G(A,B) measures how much interpretation changes based on frame ordering.
 * 
 * When G ≈ 0: frames are independent (one clearly dominates, or they're orthogonal)
 * When G >> 0: genuine narrative depth — the interpretive gestalt shifts with frame order
 */

import type { CausalAttribution, CausalFrame, NarrativeEvent } from './types.js'

export type CommutatorResult = {
  event: string
  frameA: CausalFrame
  frameB: CausalFrame
  readingAB: number
  readingBA: number
  commutator: number
  interpretation: string
}

/**
 * Compute how reading through frame A first affects interpretation via frame B.
 * 
 * When A is foregrounded, it becomes the "primary explanation."
 * B is then read AS SUPPLEMENT to A.
 * 
 * The key asymmetry: if A explains everything (high necessity), 
 * B becomes "merely additional color." But if B explains everything too,
 * the reverse ordering gives B the primacy and A becomes color.
 * 
 * The reading value = how much TOTAL explanatory work this ordering does,
 * weighted by the framing effect (primary gets more interpretive weight).
 */
function computeReading(
  attributions: CausalAttribution[],
  primaryFrame: CausalFrame,
  secondaryFrame: CausalFrame
): number {
  const primaryAttrs = attributions.filter(a => a.frame === primaryFrame)
  const secondaryAttrs = attributions.filter(a => a.frame === secondaryFrame)
  
  const pNecessity = primaryAttrs.length > 0
    ? primaryAttrs.reduce((s, a) => s + a.necessity, 0) / primaryAttrs.length
    : 0
  const sNecessity = secondaryAttrs.length > 0
    ? secondaryAttrs.reduce((s, a) => s + a.necessity, 0) / secondaryAttrs.length
    : 0

  // The framing effect: primary explanation gets exponential weight
  // This is where non-commutativity enters — the "first explanation heard"
  // anchors interpretation (anchoring bias, narrative priming)
  const primaryWeight = Math.pow(pNecessity, 0.7)  // sub-linear: even moderate necessity anchors
  const secondaryWeight = sNecessity * (1 - primaryWeight * 0.5)  // secondary diminished by strong primary
  
  return primaryWeight + secondaryWeight * 0.5
}

export function computeCommutator(
  event: NarrativeEvent,
  frameA: CausalFrame,
  frameB: CausalFrame
): CommutatorResult {
  const attributions = event.causation ?? []
  
  const readingAB = computeReading(attributions, frameA, frameB)
  const readingBA = computeReading(attributions, frameB, frameA)
  const commutator = Math.abs(readingAB - readingBA)

  let interpretation: string
  if (commutator < 0.05) {
    interpretation = 'Frames commute — event reducible to either frame'
  } else if (commutator < 0.15) {
    interpretation = 'Mild non-commutativity — frame ordering adds texture'
  } else if (commutator < 0.3) {
    interpretation = 'Significant — frame ordering changes interpretation'
  } else {
    interpretation = 'Strong non-commutativity — genuine narrative depth'
  }

  return { event: event.id, frameA, frameB, readingAB, readingBA, commutator, interpretation }
}

export function commutatorMatrix(event: NarrativeEvent): CommutatorResult[] {
  const frames = [...new Set((event.causation ?? []).map(a => a.frame))]
  const results: CommutatorResult[] = []
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      results.push(computeCommutator(event, frames[i], frames[j]))
    }
  }
  return results
}

export function narrativeDepth(event: NarrativeEvent): number {
  const matrix = commutatorMatrix(event)
  if (matrix.length === 0) return 0
  return matrix.reduce((s, r) => s + r.commutator, 0) / matrix.length
}

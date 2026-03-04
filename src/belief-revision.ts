/**
 * Belief Revision via Justification DAG
 * 
 * When new information arrives, it can undermine existing beliefs
 * by attacking their justification sources. This propagates through
 * the DAG: if Gandalf's testimony is the sole justification for 
 * Frodo's belief, and Gandalf turns out to be wrong, Frodo's belief
 * should collapse.
 * 
 * This is where epistemics meets narrative dynamics: a reveal doesn't
 * just change one fact — it can cascade through the entire epistemic
 * network.
 */

import type {
  Lens,
  Stance,
  Fact,
  NarrativeState,
  KnowerId,
  EpistemicEvent,
  DiscoursePosition,
} from './types.js'
import { knowerIdToString } from './reducer.js'

export type RevisionResult = {
  affected: Array<{
    knower: string
    fact: string
    oldStance: Stance
    newStance: Stance
    reason: string
  }>
  cascadeDepth: number
}

/**
 * Revise beliefs when a fact's truth changes or a source becomes unreliable.
 * 
 * @param state Current narrative state
 * @param trigger What changed (fact truth, source reliability, etc.)
 * @returns List of belief changes that cascade from this revision
 */
export function reviseBeliefs(
  state: NarrativeState,
  trigger: {
    kind: 'fact-truth-change'
    factId: string
    newTruth: Fact['truth']
  } | {
    kind: 'source-unreliable'
    entityId: string  // The source that became unreliable
    newReliability: number
  },
  discourse: DiscoursePosition
): RevisionResult {
  const affected: RevisionResult['affected'] = []
  let cascadeDepth = 0

  if (trigger.kind === 'fact-truth-change') {
    // Find all lenses that have stances on this fact
    for (const [knowerId, lens] of state.lenses) {
      const stances = lens.stances.get(trigger.factId)
      if (!stances) continue

      for (const stance of stances) {
        if (stance.superseded) continue

        // If they believed it was true and it's now false (or vice versa)
        const wasTrue = stance.status === 'known-true' || stance.status === 'believed-true'
        const isNowFalse = trigger.newTruth === 'false'
        
        if (wasTrue && isNowFalse) {
          const newStance: Stance = {
            ...stance,
            status: 'believed-false',
            confidence: stance.confidence * 0.3, // confidence drops
            superseded: discourse,
          }
          affected.push({
            knower: knowerId,
            fact: trigger.factId,
            oldStance: stance,
            newStance,
            reason: `Fact "${trigger.factId}" truth changed to ${trigger.newTruth}`,
          })
        }
      }
    }
  }

  if (trigger.kind === 'source-unreliable') {
    // Find all stances justified by testimony from this source
    for (const [knowerId, lens] of state.lenses) {
      for (const [factId, stances] of lens.stances) {
        for (const stance of stances) {
          if (stance.superseded) continue
          
          // Check if this stance depends on the unreliable source
          const dependsOnSource = stance.justification.sources.some(
            s => s.entityId === trigger.entityId
          )
          
          if (dependsOnSource) {
            // Reduce confidence proportional to source's role
            const sourceContribution = stance.justification.sources.filter(
              s => s.entityId === trigger.entityId
            )
            const otherSources = stance.justification.sources.filter(
              s => s.entityId !== trigger.entityId
            )
            
            // If this was the only source, confidence collapses
            // If there are other sources, it merely weakens
            const totalSources = stance.justification.sources.length
            const compromisedRatio = sourceContribution.length / totalSources
            
            const newConfidence = stance.confidence * (1 - compromisedRatio * (1 - trigger.newReliability))
            
            if (newConfidence < stance.confidence * 0.5) {
              // Significant enough change to record
              const newStatus = newConfidence < 0.3 ? 'suspected' as const : stance.status
              const newStance: Stance = {
                ...stance,
                status: newStatus,
                confidence: newConfidence,
              }
              affected.push({
                knower: knowerId,
                fact: factId,
                oldStance: stance,
                newStance,
                reason: `Source "${trigger.entityId}" reliability dropped to ${trigger.newReliability}`,
              })
              cascadeDepth = Math.max(cascadeDepth, 1)

              // CASCADE: check if this stance was a source for other stances
              // (recursive belief revision)
              // For now, just track depth 1
            }
          }
        }
      }
    }
  }

  return { affected, cascadeDepth }
}

/**
 * Print a belief revision cascade for analysis.
 */
export function printRevision(result: RevisionResult): string {
  if (result.affected.length === 0) return '  No beliefs affected.'
  
  const lines = result.affected.map(a => {
    return `  ${a.knower} → "${a.fact}": ${a.oldStance.status}(${a.oldStance.confidence.toFixed(2)}) → ${a.newStance.status}(${a.newStance.confidence.toFixed(2)})\n    reason: ${a.reason}`
  })
  return lines.join('\n')
}

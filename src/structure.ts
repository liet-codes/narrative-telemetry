/**
 * Narrative structure detection from tension dynamics.
 * 
 * Can we detect rising action, climax, falling action, and resolution
 * purely from the tension curve?
 */

import type { NarrativeState } from './types.js'

export type NarrativePhase = 
  | 'exposition'      // Low, stable tension
  | 'rising-action'   // Tension increasing
  | 'climax'          // Peak tension
  | 'falling-action'  // Tension decreasing
  | 'resolution'      // Tension near zero
  | 'denouement'      // Post-resolution, low tension

export type StructurePoint = {
  seq: number
  tension: number
  phase: NarrativePhase
  derivative: number  // rate of tension change
}

/**
 * Detect narrative structure from a tension curve.
 */
export function detectStructure(
  tensionCurve: Array<{ seq: number; tension: number }>
): StructurePoint[] {
  if (tensionCurve.length === 0) return []
  
  const maxTension = Math.max(...tensionCurve.map(p => p.tension))
  const result: StructurePoint[] = []

  for (let i = 0; i < tensionCurve.length; i++) {
    const prev = i > 0 ? tensionCurve[i - 1].tension : 0
    const curr = tensionCurve[i].tension
    const next = i < tensionCurve.length - 1 ? tensionCurve[i + 1].tension : curr
    
    const derivative = curr - prev
    const isLocalMax = curr >= prev && curr >= next
    const isNearPeak = maxTension > 0 && curr >= maxTension * 0.9

    let phase: NarrativePhase
    if (curr < 0.1) {
      phase = i === 0 ? 'exposition' : 'resolution'
    } else if (isNearPeak && isLocalMax) {
      phase = 'climax'
    } else if (derivative > 0.02) {
      phase = 'rising-action'
    } else if (derivative < -0.02) {
      phase = 'falling-action'
    } else if (curr < 0.2) {
      phase = i < tensionCurve.length / 2 ? 'exposition' : 'denouement'
    } else {
      phase = derivative >= 0 ? 'rising-action' : 'falling-action'
    }

    result.push({ seq: tensionCurve[i].seq, tension: curr, phase, derivative })
  }

  return result
}

/**
 * Print a visual structure analysis.
 */
export function printStructure(
  structure: StructurePoint[],
  events?: Map<number, string>
): string {
  const lines: string[] = []
  const phaseEmoji: Record<NarrativePhase, string> = {
    'exposition': '📖',
    'rising-action': '📈',
    'climax': '🔥',
    'falling-action': '📉',
    'resolution': '✨',
    'denouement': '🌅',
  }

  for (const pt of structure) {
    const emoji = phaseEmoji[pt.phase]
    const bar = '█'.repeat(Math.round(pt.tension * 40))
    const eventLabel = events?.get(pt.seq) ?? ''
    lines.push(`  ${emoji} seq ${String(pt.seq).padStart(2)}: ${bar.padEnd(40)} ${pt.phase.padEnd(15)} ${eventLabel}`)
  }

  return lines.join('\n')
}

/**
 * Complex-valued tension computation.
 * 
 * Each absential kind maps to a phase region in the complex plane.
 * Pressure becomes a complex number: magnitude = intensity, phase = quality.
 * 
 * Phase mapping (emergent from absential taxonomy):
 *   0°   (→)  attractor, potential — pulling toward a future
 *   45°  (↗)  prophecy — pulling toward a specific future
 *   90°  (↑)  tension, secret — perpendicular pressure, pure suspense  
 *   135° (↖)  obligation — moral weight pulling against desire
 *   180° (←)  absence, entropy — grief, loss, the pull of what's gone
 *   225° (↙)  repulsor — pushing away from danger
 *   270° (↓)  constraint — downward pressure, limitation
 * 
 * This mapping isn't arbitrary — it organizes absential kinds by their
 * phenomenological quality along two axes:
 *   Real axis: future-oriented (positive) vs past-oriented (negative)
 *   Imaginary axis: suspense/unknown (positive) vs grounding/limitation (negative)
 */

import type { Absential, AbsentialKind, NarrativeState } from './types.js'
import { type Complex, polar, add, magnitude, phase, phaseDeg, sum, rms, ZERO, toString, toPolar } from './complex.js'

// ─── Phase Mapping ──────────────────────────────────────────────────

const DEG = Math.PI / 180

/** Phase angle for each absential kind (in radians) */
const KIND_PHASE: Record<AbsentialKind, number> = {
  attractor:   0,
  potential:   0,
  prophecy:    45 * DEG,
  tension:     90 * DEG,
  secret:      90 * DEG,
  obligation:  135 * DEG,
  absence:     180 * DEG,
  entropy:     180 * DEG,
  repulsor:    225 * DEG,
  constraint:  270 * DEG,
}

// ─── Complex Pressure ───────────────────────────────────────────────

/** Convert an absential's scalar pressure to complex pressure */
export function complexPressure(abs: Absential): Complex {
  const mag = Math.abs(abs.pressure)
  const ph = KIND_PHASE[abs.kind] ?? 0
  // Direction modifier: 'away' flips phase by 180°
  const directionFlip = abs.direction === 'away' ? Math.PI : 0
  return polar(mag, ph + directionFlip)
}

// ─── Complex Tension ────────────────────────────────────────────────

export type ComplexTensionResult = {
  /** The complex tension vector (sum of complex pressures) */
  tension: Complex
  /** Magnitude = scalar tension intensity */
  magnitude: number
  /** Phase = tension quality/texture */
  phase: number
  /** Phase in degrees */
  phaseDeg: number
  /** Individual complex pressures per active absential */
  pressures: Array<{ id: string; kind: AbsentialKind; pressure: Complex }>
  /** RMS of magnitudes (comparable to old scalar tension) */
  rms: number
  /** Interference factor: ratio of vector magnitude to sum of scalar magnitudes.
   *  1.0 = all pressures aligned (constructive), 0.0 = perfect cancellation */
  interference: number
}

/** Compute complex tension from narrative state */
export function computeComplexTension(state: NarrativeState): ComplexTensionResult {
  const active = state.absentials.filter(a => !a.resolution)
  
  if (active.length === 0) {
    return {
      tension: ZERO, magnitude: 0, phase: 0, phaseDeg: 0,
      pressures: [], rms: 0, interference: 0,
    }
  }

  const pressures = active.map(a => ({
    id: a.id,
    kind: a.kind,
    pressure: complexPressure(a),
  }))

  const tensionVec = sum(pressures.map(p => p.pressure))
  const mag = magnitude(tensionVec)
  const ph = phase(tensionVec)
  const scalarSum = pressures.reduce((s, p) => s + magnitude(p.pressure), 0)
  const rmsVal = rms(pressures.map(p => p.pressure))

  return {
    tension: tensionVec,
    magnitude: mag,
    phase: ph,
    phaseDeg: phaseDeg(tensionVec),
    pressures,
    rms: rmsVal,
    interference: scalarSum > 0 ? mag / scalarSum : 0,
  }
}

// ─── Phase Interpretation ───────────────────────────────────────────

/** Interpret what a tension phase means phenomenologically */
export function interpretPhase(degrees: number): string {
  // Normalize to [0, 360)
  const d = ((degrees % 360) + 360) % 360
  
  if (d < 22.5 || d >= 337.5) return 'anticipation/desire (pulling toward future)'
  if (d < 67.5) return 'prophetic tension (fate pulling)'
  if (d < 112.5) return 'suspense/hidden knowledge (pure uncertainty)'
  if (d < 157.5) return 'moral weight/obligation (duty against desire)'
  if (d < 202.5) return 'grief/loss/entropy (the pull of absence)'
  if (d < 247.5) return 'dread/aversion (pushing away from threat)'
  if (d < 292.5) return 'constraint/limitation (downward pressure)'
  return 'constraint releasing into desire (transformation)'
}

// ─── Visualization ──────────────────────────────────────────────────

/** ASCII visualization of complex tension trajectory */
export function plotTrajectory(
  points: Array<{ seq: number; label: string; tension: ComplexTensionResult }>,
  width = 60,
  height = 30,
): string {
  if (points.length === 0) return '(no data)'

  // Find bounds
  const allRe = points.map(p => p.tension.tension.re)
  const allIm = points.map(p => p.tension.tension.im)
  const maxAbs = Math.max(
    Math.max(...allRe.map(Math.abs)),
    Math.max(...allIm.map(Math.abs)),
    0.1, // minimum scale
  ) * 1.2

  const lines: string[] = []
  lines.push('  Complex Tension Trajectory (Re = future↔past, Im = suspense↔constraint)')
  lines.push('')

  // Create grid
  const grid: string[][] = Array.from({ length: height }, () => 
    Array.from({ length: width }, () => ' ')
  )

  // Draw axes
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  for (let x = 0; x < width; x++) grid[cy][x] = '─'
  for (let y = 0; y < height; y++) grid[y][cx] = '│'
  grid[cy][cx] = '┼'

  // Plot points
  for (let i = 0; i < points.length; i++) {
    const p = points[i].tension.tension
    const x = Math.round((p.re / maxAbs) * (width / 2 - 1)) + cx
    const y = cy - Math.round((p.im / maxAbs) * (height / 2 - 1))
    
    if (x >= 0 && x < width && y >= 0 && y < height) {
      // Use sequence number or letter
      const marker = i < 10 ? String(i) : String.fromCharCode(65 + i - 10)
      grid[y][x] = marker
    }
  }

  // Render
  for (let y = 0; y < height; y++) {
    const label = y === 0 ? ' Im+' : y === height - 1 ? ' Im-' : y === cy ? ' Re-' + ' '.repeat(cx - 4) + '0' + ' '.repeat(width - cx - 1) + ' Re+' : ''
    if (y === 0 || y === height - 1 || y === cy) {
      lines.push('  ' + grid[y].join(''))
    } else {
      lines.push('  ' + grid[y].join(''))
    }
  }

  // Legend
  lines.push('')
  for (let i = 0; i < points.length; i++) {
    const marker = i < 10 ? String(i) : String.fromCharCode(65 + i - 10)
    const t = points[i].tension
    const interp = interpretPhase(t.phaseDeg)
    lines.push(`  ${marker} = seq ${points[i].seq} "${points[i].label}" — ${toPolar(t.tension)} [${interp}]`)
  }

  return lines.join('\n')
}

/** Print complex tension comparison table */
export function printComplexTensionTable(
  points: Array<{ seq: number; label: string; scalarTension: number; complex: ComplexTensionResult }>,
): string {
  const lines: string[] = []
  lines.push('  seq  scalar  |complex|  phase     interference  interpretation')
  lines.push('  ' + '─'.repeat(85))

  for (const p of points) {
    const c = p.complex
    const interp = interpretPhase(c.phaseDeg).slice(0, 30)
    lines.push(
      `  ${String(p.seq).padStart(3)}  ` +
      `${p.scalarTension.toFixed(3)}   ` +
      `${c.magnitude.toFixed(3)}     ` +
      `${c.phaseDeg.toFixed(1).padStart(7)}°  ` +
      `${c.interference.toFixed(3)}         ` +
      interp
    )
  }

  return lines.join('\n')
}

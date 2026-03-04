/**
 * Complex number utilities for narrative telemetry.
 * 
 * Complex tension: magnitude = intensity, phase = quality/texture.
 * Enables interference, cancellation, and richer commutator dynamics.
 */

export type Complex = {
  re: number
  im: number
}

// ─── Construction ───────────────────────────────────────────────────

export function complex(re: number, im: number): Complex {
  return { re, im }
}

export function polar(magnitude: number, phase: number): Complex {
  return { re: magnitude * Math.cos(phase), im: magnitude * Math.sin(phase) }
}

export const ZERO: Complex = { re: 0, im: 0 }

// ─── Arithmetic ─────────────────────────────────────────────────────

export function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im }
}

export function sub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im }
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }
}

export function scale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s }
}

export function conjugate(a: Complex): Complex {
  return { re: a.re, im: -a.im }
}

// ─── Properties ─────────────────────────────────────────────────────

export function magnitude(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im)
}

export function phase(a: Complex): number {
  return Math.atan2(a.im, a.re)
}

/** Phase in degrees */
export function phaseDeg(a: Complex): number {
  return phase(a) * 180 / Math.PI
}

/** Normalize phase to [0, 2π) */
export function phaseNorm(a: Complex): number {
  const p = phase(a)
  return p < 0 ? p + 2 * Math.PI : p
}

// ─── Utility ────────────────────────────────────────────────────────

export function toString(a: Complex, decimals = 3): string {
  const r = a.re.toFixed(decimals)
  const i = Math.abs(a.im).toFixed(decimals)
  const sign = a.im >= 0 ? '+' : '-'
  return `${r}${sign}${i}i`
}

export function toPolar(a: Complex, decimals = 3): string {
  return `${magnitude(a).toFixed(decimals)}∠${phaseDeg(a).toFixed(1)}°`
}

/** Sum an array of complex numbers */
export function sum(values: Complex[]): Complex {
  return values.reduce((acc, v) => add(acc, v), ZERO)
}

/** RMS magnitude of complex values */
export function rms(values: Complex[]): number {
  if (values.length === 0) return 0
  const sumSq = values.reduce((s, v) => s + v.re * v.re + v.im * v.im, 0)
  return Math.sqrt(sumSq / values.length)
}

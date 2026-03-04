/**
 * Absential Field Graph
 * 
 * Visualize the causal field as a directed graph where:
 * - Nodes = entities + absentials
 * - Edges = causal relationships (affects, causes, epistemic connections)
 * 
 * Can we see narrative structure emerge from the graph topology?
 */

import type { NarrativeState, Absential, EntityRef, Fact, EpistemicGap } from './types.js'
import { detectEpistemicGaps } from './reducer.js'

export type GraphNode = {
  id: string
  kind: 'entity' | 'absential' | 'fact'
  label: string
  properties: Record<string, unknown>
}

export type GraphEdge = {
  from: string
  to: string
  kind: 'affects' | 'causes' | 'knows' | 'epistemic-gap' | 'resolves' | 'introduces'
  label?: string
  weight: number
}

export type NarrativeGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * Build a graph from narrative state.
 */
export function buildGraph(state: NarrativeState): NarrativeGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Entity nodes
  for (const [id, char] of state.entities.characters) {
    nodes.push({ id: `char:${id}`, kind: 'entity', label: char.name, properties: { type: 'character', status: char.status } })
  }
  for (const [id, obj] of state.entities.objects) {
    nodes.push({ id: `obj:${id}`, kind: 'entity', label: obj.name, properties: { type: 'object', agency: obj.agency } })
  }
  for (const [id, theme] of state.entities.themes) {
    nodes.push({ id: `theme:${id}`, kind: 'entity', label: theme.name, properties: { type: 'theme', resonance: theme.resonance } })
  }

  // Absential nodes
  for (const abs of state.absentials) {
    nodes.push({
      id: `abs:${abs.id}`,
      kind: 'absential',
      label: abs.description.slice(0, 40),
      properties: { kind: abs.kind, pressure: abs.pressure, visibility: abs.visibility, resolved: !!abs.resolution },
    })

    // Edges: absential → affected entities
    for (const ref of abs.affects) {
      const targetId = refToNodeId(ref)
      edges.push({ from: `abs:${abs.id}`, to: targetId, kind: 'affects', weight: abs.pressure })
    }

    // Edges: causal attributions
    for (const cause of abs.causes) {
      for (const ref of cause.references) {
        const targetId = refToNodeId(ref)
        edges.push({ from: targetId, to: `abs:${abs.id}`, kind: 'causes', label: cause.frame, weight: cause.necessity })
      }
    }
  }

  // Fact nodes
  for (const [id, fact] of state.facts) {
    nodes.push({ id: `fact:${id}`, kind: 'fact', label: fact.claim.slice(0, 40), properties: { truth: fact.truth } })
  }

  // Epistemic edges
  for (const [knowerId, lens] of state.lenses) {
    for (const [factId, stances] of lens.stances) {
      const active = stances.filter(s => !s.superseded)
      for (const s of active) {
        edges.push({
          from: knowerId.replace(':', '-'),
          to: `fact:${factId}`,
          kind: 'knows',
          label: `${s.status} (${s.mode})`,
          weight: s.confidence,
        })
      }
    }
  }

  // Epistemic gap edges
  const gaps = detectEpistemicGaps(state)
  for (const gap of gaps) {
    for (let i = 0; i < gap.knowers.length; i++) {
      for (let j = i + 1; j < gap.knowers.length; j++) {
        if (gap.knowers[i].stance.status !== gap.knowers[j].stance.status) {
          edges.push({
            from: `gap:${gap.fact}`,
            to: `fact:${gap.fact}`,
            kind: 'epistemic-gap',
            label: gap.effect,
            weight: gap.tension,
          })
          break  // one gap edge per fact is enough
        }
      }
    }
  }

  return { nodes, edges }
}

function refToNodeId(ref: EntityRef): string {
  const prefixes: Record<string, string> = {
    character: 'char', object: 'obj', setting: 'set', theme: 'theme', relationship: 'rel',
  }
  return `${prefixes[ref.type] ?? ref.type}:${ref.id}`
}

/**
 * Print graph as DOT format (Graphviz).
 */
export function toDot(graph: NarrativeGraph): string {
  const lines: string[] = ['digraph NarrativeField {', '  rankdir=LR;', '  node [fontsize=10];']

  // Style by kind
  lines.push('  // Entities')
  for (const n of graph.nodes.filter(n => n.kind === 'entity')) {
    const shape = (n.properties.type === 'character') ? 'ellipse' : (n.properties.type === 'theme') ? 'diamond' : 'box'
    lines.push(`  "${n.id}" [label="${n.label}" shape=${shape}];`)
  }

  lines.push('  // Absentials')
  for (const n of graph.nodes.filter(n => n.kind === 'absential')) {
    const color = n.properties.resolved ? 'gray' : (n.properties.visibility === 'latent' ? 'orange' : 'red')
    lines.push(`  "${n.id}" [label="${n.label}\\n[${n.properties.kind}] p=${(n.properties.pressure as number).toFixed(2)}" shape=octagon color=${color} fontcolor=${color}];`)
  }

  lines.push('  // Facts')
  for (const n of graph.nodes.filter(n => n.kind === 'fact')) {
    lines.push(`  "${n.id}" [label="${n.label}" shape=note];`)
  }

  lines.push('  // Edges')
  for (const e of graph.edges) {
    const style = e.kind === 'epistemic-gap' ? 'dashed' : (e.kind === 'causes' ? 'bold' : 'solid')
    const color = e.kind === 'affects' ? 'red' : (e.kind === 'epistemic-gap' ? 'purple' : 'black')
    const label = e.label ? ` label="${e.label}"` : ''
    lines.push(`  "${e.from}" -> "${e.to}" [style=${style} color=${color}${label}];`)
  }

  lines.push('}')
  return lines.join('\n')
}

/**
 * Print graph statistics.
 */
export function graphStats(graph: NarrativeGraph): string {
  const entityNodes = graph.nodes.filter(n => n.kind === 'entity').length
  const absNodes = graph.nodes.filter(n => n.kind === 'absential').length
  const factNodes = graph.nodes.filter(n => n.kind === 'fact').length
  const affectsEdges = graph.edges.filter(e => e.kind === 'affects').length
  const causesEdges = graph.edges.filter(e => e.kind === 'causes').length
  const gapEdges = graph.edges.filter(e => e.kind === 'epistemic-gap').length

  // Degree centrality: most connected nodes
  const degreeMap = new Map<string, number>()
  for (const e of graph.edges) {
    degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1)
    degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1)
  }
  const sorted = [...degreeMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topNodes = sorted.map(([id, deg]) => {
    const node = graph.nodes.find(n => n.id === id)
    return `${node?.label ?? id} (${deg})`
  })

  return [
    `  Nodes: ${graph.nodes.length} (${entityNodes} entities, ${absNodes} absentials, ${factNodes} facts)`,
    `  Edges: ${graph.edges.length} (${affectsEdges} affects, ${causesEdges} causes, ${gapEdges} gaps)`,
    `  Most connected: ${topNodes.join(', ')}`,
  ].join('\n')
}

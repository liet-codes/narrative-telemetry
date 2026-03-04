// Core types
export type {
  DiegeticTime, DiscoursePosition, EntityType, EntityRef,
  Character, NarrativeObject, Setting, Theme, Relationship, RelationshipKind,
  EntityRegistry, CausalFrame, CausalAttribution,
  AbsentialKind, AbsentialVisibility, Absential,
  ApprehensionMode, Fact, JustificationKind, JustificationSource, Justification,
  StanceStatus, Stance, KnowerId, Lens,
  ReaderArchetype, EpistemicEvent, EpistemicGapEffect, EpistemicGap,
  NarrativeEvent, SpanKind, NarrativeSpan, AbsentialInteraction,
  NarrativeState, AbsentialReducer, NarrativeReducer, NarrativeTrace,
} from './types.js'

// Reducer + builders
export {
  createInitialState, createAbsential, createEvent, createFact,
  createDiscoursePosition, createDiegeticTime,
  reduce, computeTension, detectEpistemicGaps,
  replay, retroactiveInsert, knowerIdToString,
} from './reducer.js'
export type { StateHistory, TensionDiff } from './reducer.js'

// Commutator
export { computeCommutator, commutatorMatrix, narrativeDepth } from './commutator.js'
export type { CommutatorResult } from './commutator.js'

// Structure detection
export { detectStructure, printStructure } from './structure.js'
export type { NarrativePhase, StructurePoint } from './structure.js'

// Graph
export { buildGraph, toDot, graphStats } from './graph.js'
export type { GraphNode, GraphEdge, NarrativeGraph } from './graph.js'

// Belief revision
export { reviseBeliefs, printRevision } from './belief-revision.js'
export type { RevisionResult } from './belief-revision.js'

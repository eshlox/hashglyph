import type { BitStream } from '../bitstream.js';
import type { Grid } from '../grid.js';

/** Identifier of a supported visual grammar (the cell-mapping rules). */
export type GrammarId =
  | 'core-accents-v1'
  | 'mirror-identicon-v1'
  | 'symmetric-mask-v1'
  | 'quad-fold-v1'
  | 'cellular-automata-v1';

/** A single accent decision surfaced for transparency (may be empty per grammar). */
export interface AccentDecision {
  readonly x: number;
  readonly y: number;
  readonly enabled: boolean;
}

/** Inputs handed to a grammar's `build`. */
export interface GrammarContext {
  /** MSB-first reader over the (already expanded) digest. */
  readonly bits: BitStream;
  /** The normalized seed. */
  readonly normalized: string;
  /** The full expanded digest, for grammars that prefer raw bytes. */
  readonly digest: Uint8Array;
}

/** Output of a grammar. */
export interface GrammarResult {
  readonly grid: Grid;
  readonly decisions: readonly AccentDecision[];
}

/**
 * A visual grammar: deterministic rules that turn hash bits into a 9×9 grid.
 *
 * Every grammar is FROZEN once shipped. To change the rules, register a new id
 * with an incremented version suffix; never mutate a `-vN` in place.
 */
export interface GlyphGrammar {
  readonly id: GrammarId;
  /** Human-friendly name for UIs. */
  readonly label: string;
  /** One-line description of the aesthetic. */
  readonly description: string;
  /**
   * Domain-separation material id. The hash input is `${materialId}|${seed}`.
   * The hash function name is intentionally excluded so that swapping hashes
   * naturally diverges while a fixed (hash, grammar) pair stays frozen.
   */
  readonly materialId: string;
  /** Upper bound on bytes of hash material this grammar consumes. */
  readonly byteBudget: number;
  build(context: GrammarContext): GrammarResult;
}

/** Tuple helper so coordinate lists keep `number` (not `number | undefined`). */
export type Point = readonly [x: number, y: number];

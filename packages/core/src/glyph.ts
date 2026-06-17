import { bytesToHex } from '@noble/hashes/utils.js';
import { BitStream } from './bitstream.js';
import { DEFAULT_GRAMMAR, getGrammar } from './grammar/registry.js';
import type { AccentDecision, GrammarId } from './grammar/types.js';
import type { Grid } from './grid.js';
import type { HashId } from './hash/registry.js';
import { DEFAULT_HASH, getHash } from './hash/registry.js';
import { normalizeSeed } from './normalize.js';
import { DIGEST_DISPLAY_BYTES } from './version.js';

/** Options for {@link generateGlyph}. */
export interface GenerateOptions {
  /** The raw seed (e.g. a nickname). Normalized internally. */
  readonly seed: string;
  /** Hash function id. Defaults to `blake3`. */
  readonly hash?: HashId;
  /** Visual grammar id. Defaults to `core-accents-v1`. */
  readonly grammar?: GrammarId;
}

/** A fully resolved, deterministic glyph and its provenance metadata. */
export interface Glyph {
  /** The raw seed as supplied. */
  readonly seed: string;
  /** The normalized seed actually hashed. */
  readonly normalized: string;
  readonly hashId: HashId;
  readonly grammarId: GrammarId;
  /** The grammar's domain-separation id. */
  readonly materialId: string;
  /** The exact string fed to the hash: `${materialId}|${normalized}`. */
  readonly material: string;
  /** Hex of the first {@link DIGEST_DISPLAY_BYTES} expanded digest bytes. */
  readonly digestHex: string;
  /** The 9×9 pixel grid, `grid[y][x]`. */
  readonly grid: Grid;
  /** Per-grammar accent decisions (may be empty). */
  readonly decisions: readonly AccentDecision[];
}

/**
 * Generate a deterministic glyph from a seed.
 *
 * Pipeline: normalize → build material `${grammar.materialId}|${seed}` →
 * expand digest → read bits → apply grammar.
 *
 * @throws {EmptySeedError} when the seed normalizes to empty.
 * @throws {UnknownAlgorithmError} for an unknown hash or grammar id.
 */
export function generateGlyph(options: GenerateOptions): Glyph {
  const hashId = options.hash ?? DEFAULT_HASH;
  const grammarId = options.grammar ?? DEFAULT_GRAMMAR;
  const hash = getHash(hashId);
  const grammar = getGrammar(grammarId);

  const normalized = normalizeSeed(options.seed);
  const material = `${grammar.materialId}|${normalized}`;

  const length = Math.max(DIGEST_DISPLAY_BYTES, grammar.byteBudget);
  const digest = hash.expand(material, length);
  const bits = new BitStream(digest);

  const { grid, decisions } = grammar.build({ bits, normalized, digest });

  return {
    seed: options.seed,
    normalized,
    hashId,
    grammarId,
    materialId: grammar.materialId,
    material,
    digestHex: bytesToHex(digest.subarray(0, DIGEST_DISPLAY_BYTES)),
    grid,
    decisions,
  };
}

/**
 * @eshlox/hashglyph-core
 *
 * Deterministic pixel-glyph engine. Turn any seed into a stable 9×9 mark via a
 * pluggable (hash × grammar) pipeline, and render it to SVG. Isomorphic: the
 * same code runs in Node and the browser, byte for byte.
 */

export { BitStream } from './bitstream.js';

export {
  EmptySeedError,
  HashGlyphError,
  InvalidRenderOptionError,
  UnknownAlgorithmError,
} from './errors.js';
export {
  type GenerateOptions,
  type Glyph,
  generateGlyph,
} from './glyph.js';
export {
  DEFAULT_GRAMMAR,
  GRAMMAR_IDS,
  GRAMMARS,
  getGrammar,
  isGrammarId,
} from './grammar/registry.js';
export type {
  AccentDecision,
  GlyphGrammar,
  GrammarContext,
  GrammarId,
  GrammarResult,
} from './grammar/types.js';
export {
  type Cell,
  countOn,
  emptyGrid,
  type Grid,
  getCell,
  gridToAscii,
  inBounds,
  setCell,
} from './grid.js';
export {
  DEFAULT_HASH,
  getHash,
  HASH_IDS,
  HASHES,
  type HashId,
  type HashProvider,
  isHashId,
} from './hash/registry.js';
export { encodeIco, type IcoEntry } from './ico.js';
export { normalizeSeed, tryNormalizeSeed } from './normalize.js';
export {
  buildQrMatrix,
  type QrLevel,
  type QrOptions,
  renderQrSvg,
} from './qr.js';
export { assertSafeColor, isSafeColor } from './render/color.js';
export {
  type PixelShape,
  renderSvg,
  type SvgOptions,
} from './render/svg.js';
export { escapeXml } from './render/xml.js';
export {
  DIGEST_DISPLAY_BYTES,
  GRID_SIZE,
  MATERIAL_SCHEMA,
} from './version.js';
export { createZip, type ZipFiles } from './zip.js';

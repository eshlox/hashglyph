/**
 * @eshlox/hashglyph-core
 *
 * Deterministic pixel-glyph engine. Turn any seed into a stable mark via a
 * `(hash × style)` pipeline, and render it to SVG. The whole 256-bit digest is
 * encoded losslessly, so the glyph is a reversible picture of its hash and two
 * seeds colliding is computationally infeasible. Isomorphic: the same code runs
 * in Node and the browser, byte for byte.
 */

export { BitStream } from './bitstream.js';
export {
  decodeGlyph,
  decodeGlyphHex,
  digestFor,
  verifyGlyph,
} from './codec.js';
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
  type HashTier,
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
export { COLOR_PALETTE, MONO_PALETTE } from './style/palette.js';
export {
  DEFAULT_STYLE,
  getStyle,
  isStyleId,
  STYLE_IDS,
  STYLES,
} from './style/registry.js';
export type { GlyphStyle, Palette, StyleId } from './style/types.js';
export {
  DIGEST_BYTES,
  MATERIAL_PREFIX,
  MATERIAL_SCHEMA,
} from './version.js';
export { createZip, type ZipFiles } from './zip.js';

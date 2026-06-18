/**
 * @eshlox/hashglyph-cli
 *
 * Programmatic surface for the HashGlyph CLI. The command functions are pure
 * (they return in-memory artifacts), which keeps them easy to test and reuse.
 */

export type { Artifact, CommandResult } from './artifacts.js';
export { runAscii } from './commands/ascii.js';
export { runDecode } from './commands/decode.js';
export { runFavicon } from './commands/favicon.js';
export { runGenerate } from './commands/generate.js';
export { runList } from './commands/list.js';
export { runOg } from './commands/og.js';
export { runQr } from './commands/qr.js';
export { runVerify } from './commands/verify.js';
export { consoleIO, type IO } from './io.js';
export { type OgOptions, renderOgSvg } from './og-image.js';
export {
  DEFAULT_PNG_SIZES,
  OptionError,
  type RawGlyphOptions,
  type ResolvedGlyphOptions,
  resolveGlyphOptions,
} from './options.js';
export { PathEscapeError, resolveInside, slugify } from './paths.js';
export { buildProgram } from './program.js';
export { svgToPng, svgToPngSized } from './render-png.js';
export { writeArtifacts } from './runner.js';

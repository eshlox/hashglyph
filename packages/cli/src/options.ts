import {
  type GrammarId,
  type HashId,
  isGrammarId,
  isHashId,
  isSafeColor,
  type PixelShape,
  type SvgOptions,
} from '@eshlox/hashglyph-core';

/** Raw string options as parsed by commander. */
export interface RawGlyphOptions {
  hash?: string;
  grammar?: string;
  fg?: string;
  bg?: string;
  rounded?: boolean;
  padding?: string;
  scale?: string;
}

/** Validated, typed glyph + render options. */
export interface ResolvedGlyphOptions {
  hash: HashId;
  grammar: GrammarId;
  svg: SvgOptions;
}

/** A user-facing validation failure (clean message, no stack noise). */
export class OptionError extends Error {
  override readonly name = 'OptionError';
}

/** Hard cap on any rasterized pixel dimension, to bound sharp memory/CPU. */
export const MAX_RENDER_SIZE = 8192;
/** Hard cap on quiet-zone padding (cells). */
export const MAX_PADDING = 64;
/** Hard cap on SVG pixels-per-cell. */
export const MAX_SCALE = 512;
/** Hard cap on the QR payload length (matches the web app; longer codes scan poorly). */
export const MAX_QR_URL_LENGTH = 512;

/** Validate a QR payload, rejecting empty or over-cap input with a clean error. */
export function parseQrUrl(value: string): string {
  if (value.length === 0) {
    throw new OptionError('QR url must not be empty.');
  }
  if (value.length > MAX_QR_URL_LENGTH) {
    throw new OptionError(
      `QR url must be at most ${MAX_QR_URL_LENGTH} characters, got ${value.length}.`,
    );
  }
  return value;
}

function parseIntOption(label: string, value: string | undefined, max: number): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) {
    throw new OptionError(`--${label} must be an integer between 0 and ${max}, got "${value}".`);
  }
  return n;
}

/** Validate a positive rasterization size (1..MAX_RENDER_SIZE). */
export function parseRenderSize(label: string, value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_RENDER_SIZE) {
    throw new OptionError(
      `--${label} must be an integer between 1 and ${MAX_RENDER_SIZE}, got "${value}".`,
    );
  }
  return n;
}

function resolveColor(label: string, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (!isSafeColor(value)) {
    throw new OptionError(`--${label} is not a valid/safe color: "${value}".`);
  }
  return value;
}

/** Validate and resolve common glyph options, throwing OptionError on bad input. */
export function resolveGlyphOptions(raw: RawGlyphOptions): ResolvedGlyphOptions {
  const hash = raw.hash ?? 'blake3';
  if (!isHashId(hash)) {
    throw new OptionError(`Unknown --hash "${hash}".`);
  }
  const grammar = raw.grammar ?? 'core-accents-v1';
  if (!isGrammarId(grammar)) {
    throw new OptionError(`Unknown --grammar "${grammar}".`);
  }

  const pixel: PixelShape = raw.rounded ? 'rounded' : 'square';
  const fg = resolveColor('fg', raw.fg);
  const padding = parseIntOption('padding', raw.padding, MAX_PADDING);
  const scale = parseIntOption('scale', raw.scale, MAX_SCALE);

  // `--bg none|transparent` → no background.
  let bg: string | null | undefined;
  if (raw.bg === undefined) bg = undefined;
  else if (raw.bg === 'none' || raw.bg === 'transparent') bg = null;
  else bg = resolveColor('bg', raw.bg) ?? null;

  const svg: SvgOptions = {
    pixel,
    ...(fg !== undefined ? { fg } : {}),
    ...(bg !== undefined ? { bg } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...(scale !== undefined ? { scale } : {}),
  };

  return { hash, grammar, svg };
}

/** Default PNG export sizes (favicon-friendly, spec-aligned). */
export const DEFAULT_PNG_SIZES = [1024, 512, 256, 180, 64, 32, 16] as const;

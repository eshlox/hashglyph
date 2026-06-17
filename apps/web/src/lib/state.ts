import {
  DEFAULT_GRAMMAR,
  DEFAULT_HASH,
  type GrammarId,
  type HashId,
  isGrammarId,
  isHashId,
  isSafeColor,
} from '@eshlox/hashglyph-core';

/** The full, validated UI state — also the shape encoded in the permalink. */
export interface GlyphState {
  seed: string;
  hash: HashId;
  grammar: GrammarId;
  fg: string;
  bg: string;
  transparent: boolean;
  rounded: boolean;
  padding: number;
  /** Whether QR mode is enabled. */
  qrMode: boolean;
  /** The URL/text a generated QR code points to. */
  qrUrl: string;
}

/** Hard cap on seed length accepted from the URL / input (defense-in-depth). */
export const SEED_MAX_LENGTH = 64;

/** Hard cap on the QR payload length (longer codes get hard to scan with a logo). */
export const QR_URL_MAX_LENGTH = 512;

/** Length beyond which scannability degrades with a centered glyph at ECC H. */
export const QR_URL_WARN_LENGTH = 120;

export const DEFAULT_STATE: GlyphState = {
  seed: 'hashglyph',
  hash: DEFAULT_HASH,
  grammar: DEFAULT_GRAMMAR,
  fg: '#0b0e14',
  bg: '#ffffff',
  transparent: false,
  rounded: false,
  padding: 1,
  qrMode: false,
  qrUrl: 'https://hashglyph.eshlox.net',
};

/**
 * Normalize a QR target: trim, cap length, and prepend `https://` when no URI
 * scheme is present so a bare domain still resolves to a website when scanned.
 * Empty input falls back to the default site.
 */
export function normalizeQrUrl(raw: string): string {
  const trimmed = raw.trim().slice(0, QR_URL_MAX_LENGTH);
  if (trimmed.length === 0) return DEFAULT_STATE.qrUrl;
  // Already has a scheme (http:, https:, mailto:, tel:, etc.)? Keep as-is.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function clampPadding(value: string | null): number {
  if (value === null) return DEFAULT_STATE.padding;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 6) return DEFAULT_STATE.padding;
  return n;
}

function safeColor(value: string | null, fallback: string): string {
  if (value === null) return fallback;
  return isSafeColor(value) ? value : fallback;
}

/**
 * Parse UI state from URL search params. Every field is validated and falls
 * back to a safe default on bad input — this never throws, so a hand-edited or
 * malicious URL can only ever produce a valid, canonical-ish glyph.
 */
export function parseState(search: string | URLSearchParams): GlyphState {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;

  const rawSeed = (params.get('seed') ?? DEFAULT_STATE.seed).slice(0, SEED_MAX_LENGTH);
  const seed = rawSeed.trim().length > 0 ? rawSeed : DEFAULT_STATE.seed;

  const hashParam = params.get('hash');
  const grammarParam = params.get('grammar');
  const qrUrlParam = params.get('qrurl');

  return {
    seed,
    hash: hashParam && isHashId(hashParam) ? hashParam : DEFAULT_STATE.hash,
    grammar: grammarParam && isGrammarId(grammarParam) ? grammarParam : DEFAULT_STATE.grammar,
    fg: safeColor(params.get('fg'), DEFAULT_STATE.fg),
    bg: safeColor(params.get('bg'), DEFAULT_STATE.bg),
    transparent: params.get('transparent') === '1',
    rounded: params.get('rounded') === '1',
    padding: clampPadding(params.get('padding')),
    // QR mode turns on if explicitly flagged or a target URL was shared.
    qrMode: params.get('qr') === '1' || qrUrlParam !== null,
    qrUrl: qrUrlParam !== null ? normalizeQrUrl(qrUrlParam) : DEFAULT_STATE.qrUrl,
  };
}

/** Serialize state to a compact query string, omitting values left at default. */
export function toQuery(state: GlyphState): string {
  const params = new URLSearchParams();
  if (state.seed !== DEFAULT_STATE.seed) params.set('seed', state.seed);
  if (state.hash !== DEFAULT_STATE.hash) params.set('hash', state.hash);
  if (state.grammar !== DEFAULT_STATE.grammar) params.set('grammar', state.grammar);
  if (state.fg !== DEFAULT_STATE.fg) params.set('fg', state.fg);
  if (state.bg !== DEFAULT_STATE.bg) params.set('bg', state.bg);
  if (state.transparent) params.set('transparent', '1');
  if (state.rounded) params.set('rounded', '1');
  if (state.padding !== DEFAULT_STATE.padding) params.set('padding', String(state.padding));
  if (state.qrMode) {
    if (state.qrUrl !== DEFAULT_STATE.qrUrl) params.set('qrurl', state.qrUrl);
    else params.set('qr', '1');
  }
  return params.toString();
}

/** Filesystem/URL-safe slug for download filenames. */
export function slugify(seed: string): string {
  const slug = seed
    .normalize('NFKD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return slug.length > 0 ? slug : 'glyph';
}

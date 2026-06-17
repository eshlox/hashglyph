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
}

/** Hard cap on seed length accepted from the URL / input (defense-in-depth). */
export const SEED_MAX_LENGTH = 64;

export const DEFAULT_STATE: GlyphState = {
  seed: 'hashglyph',
  hash: DEFAULT_HASH,
  grammar: DEFAULT_GRAMMAR,
  fg: '#0b0e14',
  bg: '#ffffff',
  transparent: false,
  rounded: false,
  padding: 1,
};

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

  return {
    seed,
    hash: hashParam && isHashId(hashParam) ? hashParam : DEFAULT_STATE.hash,
    grammar: grammarParam && isGrammarId(grammarParam) ? grammarParam : DEFAULT_STATE.grammar,
    fg: safeColor(params.get('fg'), DEFAULT_STATE.fg),
    bg: safeColor(params.get('bg'), DEFAULT_STATE.bg),
    transparent: params.get('transparent') === '1',
    rounded: params.get('rounded') === '1',
    padding: clampPadding(params.get('padding')),
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

import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, parseState, slugify, toQuery } from '../src/lib/state.ts';

describe('parseState', () => {
  it('returns defaults for an empty query', () => {
    expect(parseState('')).toEqual(DEFAULT_STATE);
  });

  it('parses valid params', () => {
    const s = parseState('seed=portal&hash=sha256&grammar=quad-fold-v1&rounded=1&padding=2');
    expect(s.seed).toBe('portal');
    expect(s.hash).toBe('sha256');
    expect(s.grammar).toBe('quad-fold-v1');
    expect(s.rounded).toBe(true);
    expect(s.padding).toBe(2);
  });

  it('falls back to safe defaults for invalid params (never throws)', () => {
    const s = parseState('hash=md5&grammar=evil&fg=url(%23x)&padding=99');
    expect(s.hash).toBe('blake3');
    expect(s.grammar).toBe('core-accents-v1');
    expect(s.fg).toBe(DEFAULT_STATE.fg);
    expect(s.padding).toBe(DEFAULT_STATE.padding);
  });

  it('rejects unsafe colors but keeps safe hex', () => {
    expect(parseState('fg=%23ff0000').fg).toBe('#ff0000');
    expect(parseState('fg=javascript:alert(1)').fg).toBe(DEFAULT_STATE.fg);
  });

  it('caps seed length and falls back when blank', () => {
    expect(parseState(`seed=${'a'.repeat(200)}`).seed.length).toBe(64);
    expect(parseState('seed=%20%20').seed).toBe(DEFAULT_STATE.seed);
  });

  it('accepts a URLSearchParams instance', () => {
    expect(parseState(new URLSearchParams({ seed: 'x' })).seed).toBe('x');
  });
});

describe('toQuery', () => {
  it('omits values left at default', () => {
    expect(toQuery(DEFAULT_STATE)).toBe('');
  });

  it('round-trips with parseState', () => {
    const original = { ...DEFAULT_STATE, seed: 'orbit', grammar: 'mirror-identicon-v1' as const };
    expect(parseState(toQuery(original))).toEqual(original);
  });
});

describe('slugify', () => {
  it.each([
    ['HashGlyph', 'hashglyph'],
    ['../../etc', 'etc'],
    ['🚀', 'glyph'],
    ['Café Net', 'cafe-net'],
  ])('%j → %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

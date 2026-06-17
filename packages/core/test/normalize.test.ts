import { describe, expect, it } from 'vitest';
import { EmptySeedError, normalizeSeed, tryNormalizeSeed } from '../src/index.js';

describe('normalizeSeed', () => {
  it.each([
    ['hashglyph', 'hashglyph'],
    ['HashGlyph', 'hashglyph'],
    ['HASHGLYPH', 'hashglyph'],
    [' hashglyph ', 'hashglyph'],
    ['\t HashGlyph \n', 'hashglyph'],
    ['CAFÉ', 'café'],
  ])('normalizes %j → %j', (input, expected) => {
    expect(normalizeSeed(input)).toBe(expected);
  });

  it('applies NFKC (compatibility) normalization', () => {
    // U+FB01 LATIN SMALL LIGATURE FI → "fi"
    expect(normalizeSeed('ﬁle')).toBe('file');
    // Fullwidth "ＡＢＣ" → "abc"
    expect(normalizeSeed('ＡＢＣ')).toBe('abc');
  });

  it('is idempotent', () => {
    const once = normalizeSeed('  Ｅｓhlox  ');
    expect(normalizeSeed(once)).toBe(once);
  });

  it('preserves emoji (astral) seeds', () => {
    expect(normalizeSeed('🚀rocket')).toBe('🚀rocket');
  });

  it.each(['', '   ', '\t\n', '  '])('throws EmptySeedError for %j', (input) => {
    expect(() => normalizeSeed(input)).toThrow(EmptySeedError);
  });
});

describe('tryNormalizeSeed', () => {
  it('returns the normalized seed for valid input', () => {
    expect(tryNormalizeSeed(' HashGlyph ')).toBe('hashglyph');
  });

  it('returns null instead of throwing for empty input', () => {
    expect(tryNormalizeSeed('   ')).toBeNull();
  });
});

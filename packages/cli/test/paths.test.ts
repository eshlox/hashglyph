import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PathEscapeError, resolveInside, slugify } from '../src/index.js';

describe('slugify', () => {
  it.each([
    ['hashglyph', 'hashglyph'],
    ['HashGlyph Net!', 'hashglyph-net'],
    ['  spaced  out  ', 'spaced-out'],
    ['CAFÉ', 'cafe'],
    ['a/b\\c', 'a-b-c'],
  ])('slugifies %j → %j', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('neutralizes path-traversal sequences', () => {
    expect(slugify('../../etc/passwd')).toBe('etc-passwd');
    expect(slugify('..')).toBe('glyph');
    expect(slugify('/')).toBe('glyph');
  });

  it('falls back to "glyph" when nothing usable remains', () => {
    expect(slugify('🚀🚀')).toBe('glyph');
    expect(slugify('')).toBe('glyph');
  });

  it('caps the length', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(48);
  });
});

describe('resolveInside (path-traversal guard)', () => {
  const base = `${sep}tmp${sep}out`;

  it('resolves names within the base directory', () => {
    expect(resolveInside(base, 'file.svg')).toBe(`${base}${sep}file.svg`);
    expect(resolveInside(base, `sub${sep}deep.png`)).toBe(`${base}${sep}sub${sep}deep.png`);
  });

  it.each([
    '../evil',
    '../../etc/passwd',
    '..',
    `sub${sep}..${sep}..${sep}evil`,
  ])('rejects traversal: %j', (name) => {
    expect(() => resolveInside(base, name)).toThrow(PathEscapeError);
  });

  it('rejects absolute paths', () => {
    expect(() => resolveInside(base, `${sep}etc${sep}passwd`)).toThrow(PathEscapeError);
  });
});

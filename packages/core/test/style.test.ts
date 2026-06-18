import { describe, expect, it } from 'vitest';
import {
  countOn,
  DIGEST_BYTES,
  generateGlyph,
  getStyle,
  isStyleId,
  STYLE_IDS,
  STYLES,
  UnknownAlgorithmError,
} from '../src/index.js';

describe('style registry', () => {
  it('exposes exactly the two render styles', () => {
    expect(STYLE_IDS).toEqual(['mono-16', 'color-8']);
    expect(STYLES).toHaveLength(STYLE_IDS.length);
  });

  it('isStyleId narrows known/unknown ids', () => {
    expect(isStyleId('mono-16')).toBe(true);
    expect(isStyleId('color-8')).toBe(true);
    expect(isStyleId('core-accents-v1')).toBe(false);
  });

  it('throws UnknownAlgorithmError for unknown ids', () => {
    // @ts-expect-error testing the runtime guard with an invalid id
    expect(() => getStyle('nope')).toThrow(UnknownAlgorithmError);
  });

  it('every style encodes exactly the full 256-bit digest', () => {
    for (const style of STYLES) {
      expect(style.size * style.size * style.bitsPerCell).toBe(DIGEST_BYTES * 8);
      // palette[0] is the background sentinel; the rest are paint colors.
      expect(style.palette[0]).toBeNull();
      expect(style.palette.length).toBe(1 << style.bitsPerCell);
    }
  });

  it('encode/decode is a lossless round-trip for every style', () => {
    for (const style of STYLES) {
      const digest = generateGlyph({ seed: 'round-trip', style: style.id }).digest;
      expect(style.decode(style.encode(digest))).toEqual(digest);
    }
  });

  it('mono and color render the same digest two different ways', () => {
    const mono = generateGlyph({ seed: 'hashglyph', style: 'mono-16' });
    const color = generateGlyph({ seed: 'hashglyph', style: 'color-8' });
    expect(color.digestHex).toBe(mono.digestHex);
    expect(mono.grid).toHaveLength(16);
    expect(color.grid).toHaveLength(8);
  });

  it('produces a non-empty mark for the canonical seed', () => {
    for (const id of STYLE_IDS) {
      expect(countOn(generateGlyph({ seed: 'hashglyph', style: id }).grid)).toBeGreaterThan(0);
    }
  });
});

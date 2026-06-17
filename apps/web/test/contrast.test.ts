import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/lib/contrast.ts';

describe('contrastRatio', () => {
  it('returns ~21 for black on white', () => {
    const r = contrastRatio('#000000', '#ffffff');
    expect(r).not.toBeNull();
    expect(r as number).toBeGreaterThan(20.9);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('supports shorthand hex', () => {
    expect(contrastRatio('#000', '#fff')).toBeGreaterThan(20.9);
  });

  it('returns null for non-hex colors', () => {
    expect(contrastRatio('transparent', '#fff')).toBeNull();
    expect(contrastRatio('rgb(0,0,0)', '#fff')).toBeNull();
  });
});

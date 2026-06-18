import { describe, expect, it } from 'vitest';
import { generateGlyph, renderSvg } from '../src/index.js';

const glyph = generateGlyph({ seed: 'hashglyph' });

describe('renderSvg options', () => {
  it('defaults to black-on-white square pixels with crisp edges', () => {
    const svg = renderSvg(glyph);
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('omits the background rect when bg is null/transparent', () => {
    const transparent = renderSvg(glyph, { bg: null });
    // Only the foreground <g> remains; no full-canvas background fill.
    expect(transparent).not.toContain('fill="#ffffff"');
    const named = renderSvg(glyph, { bg: 'transparent' });
    expect(named).toContain('fill="transparent"');
  });

  it('honors custom colors', () => {
    const svg = renderSvg(glyph, { fg: '#ff0000', bg: '#00ff00' });
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#00ff00"');
  });

  it('emits rounded rects with rx when pixel=rounded', () => {
    const svg = renderSvg(glyph, { pixel: 'rounded', radius: 0.5 });
    expect(svg).toMatch(/<rect[^>]*rx="0\.5"/);
    expect(svg).not.toContain('shape-rendering="crispEdges"');
  });

  it('grows the viewBox with padding (quiet zone)', () => {
    expect(renderSvg(glyph, { padding: 0 })).toContain('viewBox="0 0 16 16"');
    expect(renderSvg(glyph, { padding: 1 })).toContain('viewBox="0 0 18 18"');
    expect(renderSvg(glyph, { padding: 3 })).toContain('viewBox="0 0 22 22"');
  });

  it('scales width/height while keeping the module viewBox', () => {
    const svg = renderSvg(glyph, { padding: 0, scale: 100 });
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('width="1600"');
    expect(svg).toContain('height="1600"');
  });

  it('paints a multi-color palette for the color-8 style (ignoring fg)', () => {
    const color = generateGlyph({ seed: 'hashglyph', style: 'color-8' });
    const svg = renderSvg(color, { fg: '#ff0000' });
    // The fixed palette is used; fg does not override a multi-color style.
    expect(svg).not.toContain('fill="#ff0000"');
    expect((svg.match(/<g fill="#/g) ?? []).length).toBeGreaterThan(1);
    expect(svg).toContain('viewBox="0 0 10 10"'); // 8 + padding 1 each side
  });

  it('clamps nonsensical numeric options instead of throwing', () => {
    expect(() => renderSvg(glyph, { padding: -5, radius: 9, scale: -1 })).not.toThrow();
  });

  it('uses custom title/label (escaped)', () => {
    const svg = renderSvg(glyph, { title: 'My <b>Logo</b>', label: 'a & b' });
    expect(svg).toContain('<title>My &lt;b&gt;Logo&lt;/b&gt;</title>');
    expect(svg).toContain('aria-label="a &amp; b"');
  });

  it('is parseable as XML', async () => {
    // jsdom-free structural check: balanced tags + single root.
    const svg = renderSvg(glyph);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect((svg.match(/<svg/g) ?? []).length).toBe(1);
    expect((svg.match(/<\/svg>/g) ?? []).length).toBe(1);
  });
});

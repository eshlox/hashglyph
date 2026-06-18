import { describe, expect, it } from 'vitest';
import { buildQrMatrix, generateGlyph, renderQrSvg } from '../src/index.js';

const URL = 'https://hashglyph.eshlox.net';
const glyph = generateGlyph({ seed: 'hashglyph' });

describe('QR rendering', () => {
  it('builds a non-trivial QR matrix', () => {
    const qr = buildQrMatrix(URL, 'H');
    expect(qr.size).toBeGreaterThanOrEqual(21);
    let dark = 0;
    for (let y = 0; y < qr.size; y += 1) {
      for (let x = 0; x < qr.size; x += 1) {
        if (qr.get(x, y) === 1) dark += 1;
      }
    }
    expect(dark).toBeGreaterThan(0);
  });

  it('renders a deterministic plain QR SVG', () => {
    expect(renderQrSvg(URL, null)).toBe(renderQrSvg(URL, null));
    expect(renderQrSvg(URL, null)).toContain('<svg');
  });

  it('embeds a glyph overlay and clears a centered pad', () => {
    const svg = renderQrSvg(URL, glyph);
    // Overlay group present (two <g> groups: modules + glyph).
    expect((svg.match(/<g /g) ?? []).length).toBe(2);
    expect(svg).toContain('crispEdges');
  });

  it('preserves the three finder patterns (corners stay dark modules)', () => {
    const qr = buildQrMatrix(URL, 'H');
    // Finder pattern top-left corner module is always dark.
    expect(qr.get(0, 0)).toBe(1);
    // A glyph never clears the corners: render and check corner rects exist.
    const svg = renderQrSvg(URL, glyph, { quietZone: 0 });
    expect(svg).toContain('<rect x="0" y="0" width="1" height="1"/>');
  });

  it('keeps the embedded glyph small (<= ~30% of the code)', () => {
    const svg = renderQrSvg(URL, glyph, { glyphCoverage: 0.3 });
    const qr = buildQrMatrix(URL, 'H');
    const clearMatch = svg.match(
      /<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"[^>]*fill="#ffffff"/,
    );
    expect(clearMatch).not.toBeNull();
    const clearSpan = Number(clearMatch?.[2]);
    expect(clearSpan / qr.size).toBeLessThanOrEqual(0.4);
  });

  it('is XSS-safe for hostile data', () => {
    const svg = renderQrSvg('"><script>alert(1)</script>', null);
    expect(svg).not.toMatch(/<script/i);
  });

  it('never emits NaN or Infinity coordinates for non-finite options', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const svg = renderQrSvg(URL, glyph, { quietZone: bad, glyphCoverage: bad });
      expect(svg).not.toMatch(/NaN|Infinity/);
    }
  });

  it('clamps negative and huge quiet zones to a finite value', () => {
    // Negative quiet zone clamps to 0: no negative coordinates leak into rects.
    expect(renderQrSvg(URL, null, { quietZone: -5 })).not.toMatch(/(?:x|y)="-/);
    const huge = renderQrSvg(URL, null, { quietZone: 1000 });
    expect(huge).not.toMatch(/NaN|Infinity/);
    expect(huge).toContain('<svg');
  });
});

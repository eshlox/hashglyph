import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  generateGlyph,
  InvalidRenderOptionError,
  isSafeColor,
  renderSvg,
} from '../src/index.js';

const RTL_OVERRIDE = String.fromCharCode(0x202e);

const XSS_SEEDS = [
  '"><script>alert(1)</script>',
  "' onload='alert(1)",
  ']]><svg onload=alert(1)>',
  '<<<>>>&&&"""',
  '&#x3c;script&#x3e;',
  `${RTL_OVERRIDE}evil`,
  '😈<img src=x onerror=alert(1)>',
  'a'.repeat(5000),
];

describe('SVG renderer is XSS-safe', () => {
  for (const seed of XSS_SEEDS) {
    it(`escapes a hostile seed: ${JSON.stringify(seed.slice(0, 24))}…`, () => {
      const svg = renderSvg(generateGlyph({ seed }));
      // No new markup can be injected: every metacharacter is escaped, so no
      // tags or event-handler attributes appear beyond our own.
      expect(svg).not.toMatch(/<script/i);
      expect(svg).not.toMatch(/<img/i);
      expect(svg).not.toMatch(/<foreignObject/i);
      // The seed is present only in its fully escaped form, inside <title>.
      const expectedTitle = `<title>${escapeXml(`HashGlyph glyph for "${seed}"`)}</title>`;
      expect(svg).toContain(expectedTitle);
      // Structurally intact: a single root and exactly one title.
      expect(svg.match(/<svg/g)).toHaveLength(1);
      expect(svg.match(/<title>/g)).toHaveLength(1);
    });
  }

  it('escapes the five XML metacharacters', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('strips invalid XML control characters but keeps astral chars', () => {
    const withControls = `a${String.fromCharCode(0)}b${String.fromCharCode(8)}c`;
    expect(escapeXml(withControls)).toBe('abc');
    expect(escapeXml('🚀')).toBe('🚀');
  });

  it('produces output with no external references or scripting surfaces', () => {
    const svg = renderSvg(generateGlyph({ seed: 'hashglyph' }));
    // Strip the (legitimate, required) SVG namespace declaration first.
    const body = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/<foreignObject/i);
    expect(svg).not.toMatch(/<image/i);
    expect(body).not.toMatch(/href=/i);
    expect(body).not.toMatch(/https?:\/\//i);
    // viewBox is numeric only.
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/);
  });
});

describe('color validation', () => {
  it.each([
    '#000',
    '#ffffff',
    '#12345678',
    'transparent',
    'none',
    'red',
    'rgb(1,2,3)',
    'hsl(1,2%,3%)',
  ])('accepts safe color %j', (c) => {
    expect(isSafeColor(c)).toBe(true);
  });

  it.each([
    '"><rect',
    'url(#x)',
    'javascript:alert(1)',
    'red;fill:url(x)',
    '#gggggg',
    'expression(1)',
  ])('rejects unsafe color %j', (c) => {
    expect(isSafeColor(c)).toBe(false);
  });

  it('renderSvg throws on an unsafe color', () => {
    const glyph = generateGlyph({ seed: 'hashglyph' });
    expect(() => renderSvg(glyph, { fg: '"><script>' })).toThrow(InvalidRenderOptionError);
    expect(() => renderSvg(glyph, { bg: 'url(#x)' })).toThrow(InvalidRenderOptionError);
  });
});

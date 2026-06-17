import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildJsonLd, SITE, SITE_DESCRIPTION } from '../src/lib/site.ts';

const headers = readFileSync(fileURLToPath(new URL('../public/_headers', import.meta.url)), 'utf8');

/**
 * The homepage emits inline JSON-LD. Even though `application/ld+json` is a
 * non-executing data block (not actually gated by `script-src`), we pin its
 * sha256 in the CSP as belt-and-suspenders. This test makes that pin
 * drift-proof: if the structured data ever changes, the hash changes and this
 * fails, prompting an update to `public/_headers`.
 */
describe('CSP ↔ JSON-LD', () => {
  it('pins the exact sha256 of the inline JSON-LD in script-src', () => {
    const content = JSON.stringify(buildJsonLd(SITE, SITE_DESCRIPTION));
    const hash = `sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}`;
    expect(headers).toContain(`'${hash}'`);
  });

  it('keeps a strict script-src (self + the one JSON-LD hash, no unsafe-inline)', () => {
    const csp = headers.split('\n').find((l) => l.includes('Content-Security-Policy'));
    expect(csp).toBeDefined();
    const scriptSrc = /script-src ([^;]+)/.exec(csp ?? '')?.[1] ?? '';
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain('unsafe-inline');
  });
});

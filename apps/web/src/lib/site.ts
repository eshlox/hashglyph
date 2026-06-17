/** Single source of truth for the site's identity and structured data. */

export const SITE = 'https://hashglyph.eshlox.net';

export const SITE_TITLE = 'HashGlyph — Deterministic Pixel Glyphs from Any Name';

export const SITE_DESCRIPTION =
  'HashGlyph turns any name into a stable, hashed pixel logo. Deterministic, BLAKE3-seeded, and favicon-ready — generate and download SVG, PNG, ICO and QR marks in your browser.';

/**
 * Build the JSON-LD `@graph` for the homepage. Kept in one place so the CSP
 * hash test in `test/csp.test.ts` can verify the deployed `_headers` policy
 * matches the exact inline content — `JSON.stringify(buildJsonLd())` must equal
 * what Astro emits via `set:html`.
 */
export function buildJsonLd(site: string = SITE, description: string = SITE_DESCRIPTION) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: 'HashGlyph',
        description,
      },
      {
        '@type': 'SoftwareApplication',
        name: 'HashGlyph',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any',
        description,
        url: `${site}/`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Person', name: 'eshlox' },
      },
    ],
  };
}

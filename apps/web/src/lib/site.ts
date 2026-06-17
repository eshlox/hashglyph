/** Single source of truth for the site's identity and structured data. */

export const SITE = 'https://hashglyph.eshlox.net';

export const SITE_TITLE = 'HashGlyph: Deterministic Pixel Glyphs from Any Name';

export const SITE_DESCRIPTION =
  'HashGlyph turns any name into a stable, hashed pixel logo. It is deterministic, BLAKE3-seeded, and favicon-ready, so you can generate and download SVG, PNG, ICO and QR marks right in your browser.';

/** eshlox's profile page (used as the author's canonical URL). */
export const AUTHOR_URL = 'https://eshlox.net';

/**
 * eshlox on social media. Single source of truth: rendered in the footer and
 * emitted as `sameAs` in the structured data so search engines (and Mastodon's
 * `rel="me"` check) link these profiles to the author.
 */
export const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/eshlox' },
  { label: 'Bluesky', href: 'https://bsky.app/profile/eshlox.net' },
  { label: 'Mastodon', href: 'https://fosstodon.org/@eshlox' },
] as const;

/**
 * Build the JSON-LD `@graph` for the homepage. Kept in one place so the CSP
 * hash test in `test/csp.test.ts` can verify the deployed `_headers` policy
 * matches the exact inline content, so `JSON.stringify(buildJsonLd())` must equal
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
        author: {
          '@type': 'Person',
          name: 'eshlox',
          url: AUTHOR_URL,
          sameAs: SOCIAL_LINKS.map((link) => link.href),
        },
      },
    ],
  };
}

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Fully static single-page site. Glyph generation runs entirely client-side,
// so no SSR adapter is needed — Cloudflare Pages just serves `dist/`.
export default defineConfig({
  site: 'https://hashglyph.eshlox.net',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    assets: 'assets',
  },
  devToolbar: { enabled: false },
});

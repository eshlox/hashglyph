import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Fully static single-page site. Glyph generation runs entirely client-side,
// so no SSR adapter is needed, Cloudflare Pages just serves `dist/`.
export default defineConfig({
  site: 'https://hashglyph.eshlox.net',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    assets: 'assets',
  },
  devToolbar: { enabled: false },
  vite: {
    // Allow the dev/preview server to be reached via *.eshlox.net hostnames
    // (e.g. localhost.eshlox.net). The leading dot also matches the apex.
    server: { allowedHosts: ['.eshlox.net'] },
    preview: { allowedHosts: ['.eshlox.net'] },
  },
});

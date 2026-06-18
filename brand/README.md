# HashGlyph brand assets

These files are HashGlyph's **own** frozen brand assets: the glyph for the seed
`hashglyph`, minted by `pnpm brand:generate` with the very same engine everyone
uses. They are byte-reproducible. CI regenerates them and fails if anything
drifts (`pnpm brand:verify`).

```
blake3( hashglyph-v2 | hashglyph ) = 70d824582c9c3e35…fcfd60e7
```

## Files

| File | Purpose |
| --- | --- |
| `assets/hashglyph-deterministic-glyph.svg` | Master logo (vector source of truth) |
| `assets/hashglyph-deterministic-glyph.json` | Provenance: seed, digest, grid |
| `assets/favicon.svg` | SVG favicon |
| `assets/favicon.ico` | Multi-size ICO (16/32/48) |
| `assets/hashglyph-{16,32,48,180,192,512}.png` | Raster icons |
| `assets/apple-touch-icon.png` | 180x180 Apple touch icon |
| `assets/site.webmanifest` | PWA manifest |
| `assets/og-image.{svg,png}` | 1200x630 Open Graph card |
| `assets/hashglyph-qr.{svg,png}` | QR to hashglyph.eshlox.net with the glyph |

## Regenerating

```bash
pnpm -r build          # build the engine + CLI
pnpm brand:generate    # mint assets into brand/assets and apps/web/public
pnpm brand:verify      # regenerate and assert no git diff
```

## Stability policy

HashGlyph's own mark (like every glyph) must never change. The algorithm is
pinned by the material string `hashglyph-v2|hashglyph` and the BLAKE3 hash. To
evolve the encoding, bump `MATERIAL_SCHEMA` to a new version rather than editing
the current one. See the root `README.md` and `CONTRIBUTING.md`.

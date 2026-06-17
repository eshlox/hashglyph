# HashGlyph brand assets

These files are HashGlyph's **own** frozen brand assets: the glyph for the seed
`hashglyph`, minted by `pnpm brand:generate` with the very same engine everyone
uses. They are byte-reproducible. CI regenerates them and fails if anything
drifts (`pnpm brand:verify`).

```
blake3( hashglyph-core-accents-v1 | hashglyph ) = bfd24b02875f3d34…f2ee0010
```

## Files

| File | Purpose |
| --- | --- |
| `assets/hashglyph-deterministic-glyph.svg` | Master logo (vector source of truth) |
| `assets/hashglyph-deterministic-glyph.json` | Provenance: seed, digest, grid, accents |
| `assets/favicon.svg` | SVG favicon |
| `assets/favicon.ico` | Multi-size ICO (16/32/48) |
| `assets/hashglyph-{16,32,48,180,192,512}.png` | Raster icons |
| `assets/apple-touch-icon.png` | 180×180 Apple touch icon |
| `assets/site.webmanifest` | PWA manifest |
| `assets/og-image.{svg,png}` | 1200×630 Open Graph card |
| `assets/hashglyph-qr.{svg,png}` | QR to hashglyph.eshlox.net with the glyph |

## Regenerating

```bash
pnpm -r build          # build the engine + CLI
pnpm brand:generate    # mint assets into brand/assets and apps/web/public
pnpm brand:verify      # regenerate and assert no git diff
```

## Stability policy

HashGlyph's own mark (like every glyph) must never change. The algorithm is
pinned by the material string `hashglyph-core-accents-v1|hashglyph` and the
BLAKE3 hash. To evolve the visual system, add a **new** versioned grammar (e.g.
`core-accents-v2`) and never edit a shipped `-v1`. See the root `README.md` and
`CONTRIBUTING.md`.

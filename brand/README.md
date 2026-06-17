# HashGlyph brand assets

These files are the **frozen** brand assets for `eshlox`, minted from the
canonical seed by `pnpm brand:generate`. They are byte-reproducible: CI
regenerates them and fails if anything drifts (`pnpm brand:verify`).

```
blake3( eshlox-deterministic-glyph-v1 | eshlox ) = 4b343318ccb00312…d600440
```

## Files

| File | Purpose |
| --- | --- |
| `assets/eshlox-deterministic-glyph.svg` | Master logo (vector source of truth) |
| `assets/eshlox-deterministic-glyph.json` | Provenance: seed, digest, grid, accents |
| `assets/favicon.svg` | SVG favicon |
| `assets/favicon.ico` | Multi-size ICO (16/32/48) |
| `assets/eshlox-{16,32,48,180,192,512}.png` | Raster icons |
| `assets/apple-touch-icon.png` | 180×180 Apple touch icon |
| `assets/site.webmanifest` | PWA manifest |
| `assets/og-image.{svg,png}` | 1200×630 Open Graph card |
| `assets/eshlox-qr.{svg,png}` | QR to hashglyph.eshlox.net with the glyph |

## Regenerating

```bash
pnpm -r build          # build the engine + CLI
pnpm brand:generate    # mint assets into brand/assets and apps/web/public
pnpm brand:verify      # regenerate and assert no git diff
```

## Stability policy

The canonical mark must never change. The algorithm is pinned by the material
string `eshlox-deterministic-glyph-v1|eshlox` and the BLAKE3 hash. To evolve the
visual system, add a **new** versioned grammar (e.g. `-v2`) — never edit a
shipped `-v1`. See the root `README.md` and `CONTRIBUTING.md`.

# HashGlyph

**A name in. A glyph out. Always the same one.**

HashGlyph turns any word into a deterministic, pixel-based logo. The seed is
normalized, hashed with **BLAKE3**, and mapped onto a constrained 9×9 visual
grammar. The same seed always gives the same mark. It reads like part monogram,
part favicon, part terminal-era artifact.

```
·········
·███████·     blake3( hashglyph-core-accents-v1 | hashglyph )
·██···██·       = bfd24b02875f3d34…f2ee0010
·█·███·█·
·███████·     seed:    hashglyph        ← the project's own mark
·█·███·█·     hash:    blake3
·██···██·     grammar: core-accents-v1   (default)
·███████·
·········     (type any word to mint your own)
```

→ **Live generator: [hashglyph.eshlox.net](https://hashglyph.eshlox.net)**

---

## Why it works as a logo

Most generated identicons look random. HashGlyph keeps the **brand structure
designed** and lets the **hash drive only the accents**:

- **deterministic:** the same input always yields the same mark;
- **personal:** the seed is your own name;
- **technical:** it comes straight out of a cryptographic hash;
- **scalable:** it stays crisp from a 16px favicon to a wall-sized SVG;
- **story-driven:** it's a compressed digital signature, not a generic icon.

## Quick start

### CLI

```bash
# no install needed
npx @eshlox/hashglyph-cli generate eshlox --json --ascii

# or install globally
npm i -g @eshlox/hashglyph-cli
hashglyph generate your-name         # SVG + JSON + PNG set → ./dist
hashglyph favicon your-name          # full favicon/PWA set + favicon.ico
hashglyph og your-name               # 1200×630 Open Graph card
hashglyph qr https://you.dev --seed your-name   # QR with a centered glyph
hashglyph ascii your-name            # print it to your terminal
hashglyph list                       # all hashes × grammars
```

### Library

```ts
import { generateGlyph, renderSvg } from '@eshlox/hashglyph-core';

const glyph = generateGlyph({ seed: 'your-name' });   // hash + grammar are pluggable
const svg = renderSvg(glyph, { fg: '#0b0e14', bg: '#ffffff', padding: 1 });
```

## The determinism contract

The input to the hash is a domain-separated material string:

```
${grammar.materialId}|${normalize(seed)}      normalize = NFKC · trim · lowercase
```

The hash name is intentionally **not** part of the material, so swapping hashes
diverges naturally while a fixed `(hash, grammar)` pair stays frozen forever.

The default grammar is `core-accents-v1`. HashGlyph's own logo is just the glyph
for the seed `hashglyph`, and you can verify it yourself:

```js
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

bytesToHex(blake3(utf8ToBytes('hashglyph-core-accents-v1|hashglyph'), { dkLen: 64 }));
// → bfd24b02875f3d34cd6e99511319eb8c3933bd54563973a40dfec2c8833e27ad…
```

Hash bits are read **most-significant-first**; the first 8 bits decide the eight
accent pixels. Every seed gets the same treatment, so your name maps to exactly
one mark, forever.

## Algorithms: hash × grammar

It's pluggable on two axes: **6 hashes × 5 grammars = 30 combinations**. The
default combo mints the canonical mark; the rest are yours to explore.

| Hashes | Grammars |
| --- | --- |
| `blake3` (default), `sha256`, `sha512`, `sha3-256`, `sha3-512`, `keccak256` | `core-accents-v1` (canonical), `mirror-identicon-v1`, `symmetric-mask-v1`, `quad-fold-v1`, `cellular-automata-v1` |

Fixed-length hashes are expanded to the grammar's bit budget with a counter
construction; BLAKE3 uses its native XOF (so its 64-byte digest is exactly the
canonical one). Every grammar is mirror-symmetric, so output reads as a *mark*,
not noise.

## CLI reference

| Command | Output |
| --- | --- |
| `generate <seed>` | SVG, optional JSON metadata, PNG set (`--size`, `--json`, `--ascii`, `--no-png`) |
| `favicon <seed>` | 16/32/48/180/192/512 PNGs + `favicon.ico` + `site.webmanifest` |
| `og <seed>` | 1200×630 Open Graph card (`--title --slogan --url`) |
| `qr <url>` | QR code, optionally with a centered glyph (`--seed`) |
| `ascii <seed>` | Print the glyph to the terminal |
| `list` | List available hashes and grammars |

Shared options: `--hash --grammar --fg --bg --rounded --padding --scale --out`.

## Repository layout

```
packages/core   @eshlox/hashglyph-core   isomorphic engine (browser + Node)
packages/cli    @eshlox/hashglyph-cli    CLI (sharp PNG, favicons, OG, QR)
apps/web        Astro single-page site (static → Cloudflare Pages)
brand/          frozen, reproducible brand assets
```

## Development

```bash
pnpm install
pnpm -r build        # build core + cli (TS project references)
pnpm test            # vitest: 180+ unit/property/security tests
pnpm typecheck       # tsc --build
pnpm check           # biome lint + format
pnpm dev:web         # run the site locally
pnpm --filter @eshlox/hashglyph-web test:e2e   # Playwright
pnpm brand:verify    # regenerate brand assets and assert no drift
```

Requires Node ≥ 24 and pnpm.

## Deploying the site (Cloudflare Pages)

The site is fully static. Generation runs client-side, so there's no SSR adapter.

- **Build command:** `pnpm install && pnpm -r build && pnpm --filter @eshlox/hashglyph-web build`
- **Output directory:** `apps/web/dist`
- **Custom domain:** `hashglyph.eshlox.net`

## Stability policy

The canonical mark must never change. Grammars are pinned with a version suffix
and frozen on release. To evolve the visual system, register a **new** grammar
(e.g. `core-accents-v2`) and never edit a shipped `-v1`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Untrusted seeds are escape-by-construction safe in SVG output, colors are
validated against an allowlist, and CLI filenames can never escape the output
directory. See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © eshlox

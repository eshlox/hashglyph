# HashGlyph

**A name in. A glyph out. Always the same one.**

HashGlyph turns any word into a deterministic, pixel-based logo. The seed is
normalized, hashed with **BLAKE3**, and mapped onto a constrained 9×9 visual
grammar. Same seed → same mark, forever — part monogram, part favicon, part
terminal-era artifact.

```
·········
·███████·     blake3( eshlox-deterministic-glyph-v1 | eshlox )
·██···██·       = 4b343318ccb00312…d600440
·█·███·█·
·██·████·     seed:    eshlox
·█·███·█·     hash:    blake3
·██···██·     grammar: core-accents-v1   (canonical)
·███████·
·········
```

→ **Live generator: [hashglyph.eshlox.net](https://hashglyph.eshlox.net)**

---

## Why it works as a logo

Most generated identicons look random. HashGlyph keeps the **brand structure
designed** and lets the **hash drive only the accents**:

- **deterministic** — the same input always yields the same mark;
- **personal** — the seed is your name;
- **technical** — generated from a cryptographic hash;
- **scalable** — crisp from a 16px favicon to a wall-sized SVG;
- **story-driven** — a compressed digital signature, not a generic icon.

## Quick start

### CLI

```bash
# no install needed
npx @eshlox/hashglyph-cli generate eshlox --json --ascii

# or install globally
npm i -g @eshlox/hashglyph-cli
hashglyph generate eshlox            # SVG + JSON + PNG set → ./dist
hashglyph favicon eshlox             # full favicon/PWA set + favicon.ico
hashglyph og eshlox                  # 1200×630 Open Graph card
hashglyph qr https://you.dev --seed eshlox   # QR with a centered glyph
hashglyph ascii eshlox               # print it to your terminal
hashglyph list                       # all hashes × grammars
```

### Library

```ts
import { generateGlyph, renderSvg } from '@eshlox/hashglyph-core';

const glyph = generateGlyph({ seed: 'eshlox' });   // hash + grammar are pluggable
const svg = renderSvg(glyph, { fg: '#0b0e14', bg: '#ffffff', padding: 1 });
```

## The determinism contract

The input to the hash is a domain-separated material string:

```
${grammar.materialId}|${normalize(seed)}      normalize = NFKC · trim · lowercase
```

The hash name is intentionally **not** part of the material, so swapping hashes
diverges naturally while a fixed `(hash, grammar)` pair stays frozen forever.

The canonical mark is `blake3` + `core-accents-v1`. Verify it yourself:

```js
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

bytesToHex(blake3(utf8ToBytes('eshlox-deterministic-glyph-v1|eshlox'), { dkLen: 64 }));
// → 4b343318ccb00312918f026859a895c7cba8de501c4dd05281e9244998b160c0…
```

Hash bits are read **most-significant-first**; the first 8 bits (`0x4b` =
`01001011`) decide the eight accent pixels: `false,true,false,false,true,false,true,true`.

## Algorithms: hash × grammar

Pluggable on two axes — **6 hashes × 5 grammars = 30 combinations**. The
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

The site is fully static (generation runs client-side — no SSR adapter).

- **Build command:** `pnpm install && pnpm -r build && pnpm --filter @eshlox/hashglyph-web build`
- **Output directory:** `apps/web/dist`
- **Custom domain:** `hashglyph.eshlox.net`

## Stability policy

The canonical mark must never change. Grammars are pinned with a version suffix
and frozen on release. To evolve the visual system, register a **new** grammar
(e.g. `core-accents-v2`) — never edit a shipped `-v1`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Untrusted seeds are escape-by-construction safe in SVG output, colors are
validated against an allowlist, and CLI filenames can never escape the output
directory. See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © eshlox

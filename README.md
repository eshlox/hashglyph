# HashGlyph

**A name in. A glyph out. Always the same one, and never the same as anyone else's.**

HashGlyph turns any word into a deterministic, pixel-based logo. The seed is
normalized, hashed to a full **256-bit digest**, and every bit of that digest is
drawn into the grid. Nothing is thrown away, so the glyph is a lossless picture
of the hash: two different names landing on the same glyph is computationally
infeasible, and a glyph reads straight back into its digest.

```
·███····██·██···
··█··█···█·██···   blake3( hashglyph-v2 | hashglyph )
··█·██··█··███··     = 70d824582c9c3e35…fcfd60e7   (the 256-bit identity)
··█████···██·█·█
·██·····██····█·   seed:  hashglyph        ← the project's own mark
·█·█·█·███··█·██   hash:  blake3
█·███·█··████··█   style: mono-16          (default; 8x8 color-8 also ships)
███··██████·█·█·
 …                 (type any word to mint your own)
```

→ **Live generator: [hashglyph.eshlox.net](https://hashglyph.eshlox.net)**

---

## Why it works

- **deterministic:** the same input always yields the same glyph;
- **unique:** the whole 256-bit hash is on the wall, so with a strong hash a
  collision between two names is infeasible (~2^128 work);
- **reversible:** decode a glyph back to its digest, or prove a name produced it;
- **personal:** the seed is your own name;
- **scalable:** it stays crisp from a 16px favicon to a wall-sized SVG.

A glyph is a visual fingerprint of a one-way hash. You can recover the digest
from it, but never the original text.

## Quick start

### CLI

```bash
# no install needed
npx @eshlox/hashglyph-cli generate eshlox --json --ascii

# or install globally
npm i -g @eshlox/hashglyph-cli
hashglyph generate your-name                    # SVG + JSON + PNG set → ./dist
hashglyph generate your-name --style color-8    # 8x8 color mosaic
hashglyph favicon your-name                     # full favicon/PWA set + favicon.ico
hashglyph og your-name                          # 1200x630 Open Graph card
hashglyph qr https://you.dev --seed your-name   # QR with a centered glyph
hashglyph decode your-name.svg                  # read the digest back out
hashglyph verify your-name.svg your-name        # prove a name produced a glyph
hashglyph list                                  # all hashes (with tiers) + styles
```

### Library

```ts
import { generateGlyph, renderSvg, decodeGlyphHex, verifyGlyph } from '@eshlox/hashglyph-core';

const glyph = generateGlyph({ seed: 'your-name' });   // hash + style are pluggable
const svg = renderSvg(glyph, { fg: '#0b0e14', bg: '#ffffff', padding: 1 });

decodeGlyphHex(glyph.grid, 'mono-16');                     // → the 256-bit digest, hex
verifyGlyph(glyph.grid, 'mono-16', 'your-name', 'blake3'); // → true
```

## The determinism contract

The input to the hash is a domain-separated material string:

```
hashglyph-v2|${normalize(seed)}      normalize = NFKC · trim · lowercase
```

The hash name and the style are intentionally **not** part of the material, so a
fixed `(hash, seed)` pair yields one canonical 256-bit digest. The two styles
just render that digest differently, and swapping the hash diverges naturally.

HashGlyph's own logo is just the glyph for the seed `hashglyph`, and you can
verify the digest yourself:

```js
import { blake3 } from '@noble/hashes/blake3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

bytesToHex(blake3(utf8ToBytes('hashglyph-v2|hashglyph'), { dkLen: 32 }));
// → 70d824582c9c3e3560c255cbba79e7ead272920df7054db08c68ee58fcfd60e7
```

Digest bits are read **most-significant-first**: in `mono-16` each bit is one of
256 pixels; in `color-8` each group of 4 bits picks one of 16 palette colors.

## Algorithms: hash × style

The **hash decides the glyph**; the **style only decides how it is drawn**. There
are **17 hashes** rendered in **2 styles**.

| | |
| --- | --- |
| **Hashes (strong)** | `blake3` (default), `blake2b`, `blake2s`, `sha256`, `sha384`, `sha512`, `sha512-256`, `sha3-256`, `sha3-512`, `shake128`, `shake256`, `keccak256`, `keccak512` |
| **Hashes (reduced margin)** | `sha224`, `ripemd160` |
| **Hashes (broken, fun only)** | `sha1`, `md5` |
| **Styles** | `mono-16` (default, 16x16 black & white), `color-8` (8x8, 16-color mosaic) |

Both styles encode exactly 256 bits, so a glyph is a complete picture of its
digest. Extendable-output functions (BLAKE3, SHAKE) emit those 256 bits natively;
fixed-length hashes are stretched with an HKDF-style counter construction, which
never adds entropy beyond the hash's native width. `sha1`/`md5` are
cryptographically broken: collisions can be constructed on purpose, so they
cannot honor the "no two names collide" guarantee and are included for fun only.

## CLI reference

| Command | Output |
| --- | --- |
| `generate <seed>` | SVG, optional JSON metadata, PNG set (`--size`, `--json`, `--ascii`, `--no-png`) |
| `favicon <seed>` | 16/32/48/180/192/512 PNGs + `favicon.ico` + `site.webmanifest` |
| `og <seed>` | 1200x630 Open Graph card (`--title --slogan --url`) |
| `qr <url>` | QR code, optionally with a centered glyph (`--seed`) |
| `decode <file>` | Read the 256-bit digest back out of a HashGlyph SVG |
| `verify <file> <seed>` | Check that an SVG is the glyph a given seed produces |
| `ascii <seed>` | Print the glyph to the terminal |
| `list` | List available hashes (with tiers) and styles |

Shared glyph options: `--hash --style --fg --bg --rounded --padding --scale --out`.

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
pnpm build:packages  # build core + cli (TS project references)
pnpm build           # build the deployable site → ./dist
pnpm test            # vitest: unit/property/security tests
pnpm typecheck       # tsc --build
pnpm check           # biome lint + format
pnpm dev:web         # run the site locally
pnpm --filter @eshlox/hashglyph-web test:e2e   # Playwright
pnpm brand:verify    # regenerate brand assets and assert no drift
```

Requires Node ≥ 24.13.1 and pnpm.

## Deploying the site (Cloudflare Pages)

The site is fully static. Generation runs client-side, so there is no SSR
adapter and no `wrangler.toml`. Deployment relies on three in-repo conventions
plus a few dashboard settings.

**In the repo (already set up):**

1. `package.json` pins the package manager so Cloudflare's corepack installs the
   right pnpm: `"packageManager": "pnpm@11.7.0"`. Without this you get
   `No preset version installed for command pnpm`.
2. `.nvmrc` pins the build's Node version (`24.13.1`), which is what Cloudflare
   Pages reads to pick the runtime. `engines` requires `"node": ">=24.13.1"` to
   match, so local, CI, and Cloudflare all build on the same Node.
3. `pnpm-workspace.yaml` whitelists the native install scripts Astro needs via
   `allowBuilds: { esbuild: true, sharp: true }`.

The committed `pnpm-lock.yaml` plus `packageManager` let Cloudflare auto-detect
pnpm, so you don't override the install command.

**In the Cloudflare Pages dashboard** (Settings → Builds & deployments):

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or None) |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Install command | `pnpm install` (auto) |
| Root directory | `/` |

`pnpm build` compiles `@eshlox/hashglyph-core` first and then the Astro app. Even
though this is a monorepo, Astro is configured (`outDir: '../../dist'`) to emit to
the repo-root `dist/`, so Cloudflare's default output directory finds it with no
extra dashboard config. Point your custom domain `hashglyph.eshlox.net` at the
Pages project and you're done.

## Stability policy

The encoding is frozen behind `MATERIAL_SCHEMA = 'v2'`: the material recipe, the
256-bit digest width, and each style's bit layout. Changing any of them changes
every glyph, so they only move under a new schema version. See
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Untrusted seeds are escape-by-construction safe in SVG output, colors are
validated against an allowlist, and CLI filenames can never escape the output
directory. A glyph is a one-way fingerprint: it exposes the digest, never the
seed. See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © eshlox

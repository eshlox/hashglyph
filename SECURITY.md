# Security policy

HashGlyph is a small, dependency-light tool, but it processes **untrusted input**
(seeds, URLs, colors, permalink params) and emits markup and files. This is the
threat model and how each risk is mitigated.

## Threat model & mitigations

### 1. SVG / XSS injection (untrusted seed → markup)

Seeds appear in the SVG `<title>` and `aria-label`, and the SVG may be inlined
into HTML or copied to a clipboard.

- All text passes through a single `escapeXml` choke point that strips invalid
  XML characters and entity-encodes `& < > " '`.
- The renderer emits **no** `<script>`, `<foreignObject>`, external `href`s, or
  remote `<image>` references.
- Property-based and explicit XSS-vector tests assert that hostile seeds
  (`"><script>`, `' onload=`, `]]>`, RTL overrides, astral chars, 5000-char
  seeds) only ever appear in fully escaped form.

### 2. Colour injection

`--fg` / `--bg` and permalink colours are validated against an allowlist
(hex, a small set of CSS keywords, and restricted `rgb()/hsl()` forms) before
ever touching SVG attributes. Anything else is rejected.

### 3. Path traversal (untrusted seed → filename)

CLI output filenames are derived from a strict slug (`[a-z0-9-]`, length-capped)
and never from the raw seed. Every write is resolved through `resolveInside`,
which rejects absolute paths and any `..` that would escape the chosen output
directory.

### 4. Permalink robustness (web)

`?seed`/`?hash`/`?style`/`?fg`/`?bg`/`?padding` are validated and clamped;
unknown or unsafe values fall back to safe defaults. Parsing **never throws**,
so a hand-crafted URL can only ever produce a valid glyph. Seed length is capped.

### 5. Supply chain

Dependencies are few, reputable, and pinned exactly. The site is fully static
(no server, no SSR). CI runs `pnpm audit`. Generated brand binaries are
byte-reproducible and verified in CI (`pnpm brand:verify`).

### 6. Hashing scope (not a security feature)

BLAKE3 here is a deterministic randomness source for graphics, **not** a
security primitive. Do not use HashGlyph (or raw BLAKE3/SHA) for password
storage; use Argon2id, scrypt, or bcrypt instead.

## Reporting a vulnerability

Please report security issues privately to **eshlox@vertolabs.com** rather than
opening a public issue. We aim to acknowledge within a few days.

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type Artifact,
  resolveGlyphOptions,
  runFavicon,
  runGenerate,
  runOg,
  runQr,
  writeArtifacts,
} from '../src/index.js';

const options = resolveGlyphOptions({});
const silentIO = { log: () => {}, warn: () => {}, error: () => {} };

function byName(artifacts: readonly Artifact[], suffix: string): Artifact | undefined {
  return artifacts.find((a) => a.name.endsWith(suffix));
}

function isPng(data: Uint8Array): boolean {
  return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
}

/** Read width/height from a PNG IHDR (bytes 16-23, big-endian). */
function pngSize(data: Uint8Array): { width: number; height: number } {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe('runGenerate', () => {
  it('produces an SVG, JSON, and the requested PNG sizes', async () => {
    const { artifacts, summary } = await runGenerate({
      seed: 'hashglyph',
      options,
      sizes: [32, 16],
      json: true,
      ascii: false,
    });
    expect(byName(artifacts, 'hashglyph.svg')).toBeDefined();
    expect(artifacts.filter((a) => a.name.endsWith('.png'))).toHaveLength(2);

    const json = byName(artifacts, '.json');
    expect(json).toBeDefined();
    const meta = JSON.parse(json?.data as string);
    expect(meta.normalized).toBe('hashglyph');
    expect(meta.digestHex).toMatch(/^bfd24b02/);
    expect(meta.grid).toHaveLength(9);

    const png = byName(artifacts, '-32.png');
    expect(isPng(png?.data as Uint8Array)).toBe(true);
    expect(summary.join('\n')).toContain('hashglyph');
  });

  it('skips PNGs when sizes is empty', async () => {
    const { artifacts } = await runGenerate({
      seed: 'hashglyph',
      options,
      sizes: [],
      json: false,
      ascii: false,
    });
    expect(artifacts.every((a) => !a.name.endsWith('.png'))).toBe(true);
    expect(artifacts).toHaveLength(1); // just the SVG
  });
});

describe('runFavicon', () => {
  it('produces a complete favicon set with ICO and manifest', async () => {
    const { artifacts } = await runFavicon({ seed: 'hashglyph', options });
    const names = artifacts.map((a) => a.name);
    expect(names).toContain('favicon.ico');
    expect(names).toContain('site.webmanifest');
    expect(names).toContain('apple-touch-icon.png');
    for (const size of [16, 32, 48, 180, 192, 512]) {
      expect(names).toContain(`hashglyph-${size}.png`);
    }
    const ico = byName(artifacts, '.ico')?.data as Uint8Array;
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);
    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type = icon
    expect(view.getUint16(4, true)).toBe(3); // 16/32/48
  });
});

describe('runOg', () => {
  it('produces a 1200×630 PNG card', async () => {
    const { artifacts } = await runOg({ seed: 'hashglyph', options, og: {} });
    const png = byName(artifacts, '-og.png')?.data as Uint8Array;
    expect(isPng(png)).toBe(true);
    expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
  });
});

describe('runQr', () => {
  it('produces SVG + PNG, with a glyph when a seed is given', async () => {
    const withGlyph = await runQr({
      url: 'https://hashglyph.eshlox.net',
      seed: 'hashglyph',
      options,
      size: 256,
    });
    expect(byName(withGlyph.artifacts, '-qr.svg')).toBeDefined();
    expect(isPng(byName(withGlyph.artifacts, '-qr.png')?.data as Uint8Array)).toBe(true);
    expect(withGlyph.summary.join('\n')).toContain('ECC level H');

    const plain = await runQr({ url: 'https://x.test', seed: null, options, size: 128 });
    expect(byName(plain.artifacts, 'qr.svg')).toBeDefined();
  });
});

describe('writeArtifacts', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'hashglyph-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes files to disk and returns their paths', async () => {
    const { artifacts } = await runGenerate({
      seed: 'hashglyph',
      options,
      sizes: [16],
      json: true,
      ascii: false,
    });
    const written = await writeArtifacts(dir, artifacts, silentIO);
    expect(written.length).toBe(artifacts.length);
    const svg = await readFile(join(dir, 'hashglyph.svg'), 'utf8');
    expect(svg).toContain('<svg');
  });

  it('refuses to write outside the output directory', async () => {
    const evil: Artifact[] = [{ name: '../escape.svg', data: 'x' }];
    await expect(writeArtifacts(dir, evil, silentIO)).rejects.toThrow();
  });
});

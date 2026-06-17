import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createZip, encodeIco } from '../src/index.js';

// A tiny but structurally valid PNG (1×1) — enough to exercise the containers.
const PNG_1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('encodeIco', () => {
  it('writes a valid ICONDIR header and entry table', () => {
    const ico = encodeIco([
      { size: 16, png: PNG_1x1 },
      { size: 32, png: PNG_1x1 },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type = icon
    expect(view.getUint16(4, true)).toBe(2); // count
    expect(ico[6]).toBe(16); // first entry width
  });

  it('encodes size 256 as the byte 0', () => {
    const ico = encodeIco([{ size: 256, png: PNG_1x1 }]);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
  });

  it('rejects empty input and out-of-range sizes', () => {
    expect(() => encodeIco([])).toThrow(RangeError);
    expect(() => encodeIco([{ size: 0, png: PNG_1x1 }])).toThrow(RangeError);
    expect(() => encodeIco([{ size: 257, png: PNG_1x1 }])).toThrow(RangeError);
  });
});

describe('createZip', () => {
  it('round-trips files and is deterministic', () => {
    const files = { 'a.txt': new TextEncoder().encode('hello'), 'b.bin': PNG_1x1 };
    const zipA = createZip(files);
    const zipB = createZip(files);
    expect(zipA).toEqual(zipB); // byte-stable

    const back = unzipSync(zipA);
    expect(new TextDecoder().decode(back['a.txt'])).toBe('hello');
    expect(back['b.bin']).toEqual(PNG_1x1);
  });
});

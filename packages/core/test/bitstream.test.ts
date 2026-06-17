import { describe, expect, it } from 'vitest';
import { BitStream } from '../src/index.js';

describe('BitStream', () => {
  it('reads bits most-significant-first', () => {
    // 0x4b = 0100 1011
    const bs = new BitStream(new Uint8Array([0x4b]));
    expect([
      bs.bit(),
      bs.bit(),
      bs.bit(),
      bs.bit(),
      bs.bit(),
      bs.bit(),
      bs.bit(),
      bs.bit(),
    ]).toEqual([0, 1, 0, 0, 1, 0, 1, 1]);
  });

  it('matches the canonical accent decisions from byte 0 (0x4b)', () => {
    const bs = new BitStream(new Uint8Array([0x4b]));
    const decisions = Array.from({ length: 8 }, () => bs.bool());
    expect(decisions).toEqual([false, true, false, false, true, false, true, true]);
  });

  it('crosses byte boundaries correctly', () => {
    // 0x80, 0x01 => 1000 0000 0000 0001
    const bs = new BitStream(new Uint8Array([0x80, 0x01]));
    expect(bs.bit()).toBe(1);
    expect(bs.bits(14)).toBe(0);
    expect(bs.bit()).toBe(1);
  });

  it('reads multi-bit unsigned integers big-endian', () => {
    const bs = new BitStream(new Uint8Array([0xab, 0xcd]));
    expect(bs.bits(16)).toBe(0xabcd);
  });

  it('tracks position and remaining', () => {
    const bs = new BitStream(new Uint8Array([0, 0]));
    expect(bs.length).toBe(16);
    bs.bits(5);
    expect(bs.position).toBe(5);
    expect(bs.remaining).toBe(11);
  });

  it('throws when exhausted', () => {
    const bs = new BitStream(new Uint8Array([0]));
    bs.bits(8);
    expect(() => bs.bit()).toThrow(RangeError);
  });

  it('rejects out-of-range bit counts', () => {
    const bs = new BitStream(new Uint8Array(8));
    expect(() => bs.bits(33)).toThrow(RangeError);
    expect(() => bs.bits(-1)).toThrow(RangeError);
  });
});

/**
 * A most-significant-bit-first reader over a byte array.
 *
 * Bit order is part of the determinism contract: bit 0 is the high bit (`0x80`)
 * of byte 0. Never change this, it would silently alter every glyph.
 */
export class BitStream {
  readonly #bytes: Uint8Array;
  #index = 0;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  /** Total number of bits available. */
  get length(): number {
    return this.#bytes.length * 8;
  }

  /** Number of bits already consumed. */
  get position(): number {
    return this.#index;
  }

  /** Bits still unread. */
  get remaining(): number {
    return this.length - this.#index;
  }

  /** Read a single bit (MSB-first). @throws {RangeError} when exhausted. */
  bit(): 0 | 1 {
    if (this.#index >= this.length) {
      throw new RangeError('BitStream exhausted: not enough hash material.');
    }
    const byte = this.#bytes[this.#index >>> 3] ?? 0;
    const shift = 7 - (this.#index & 7);
    this.#index += 1;
    return ((byte >> shift) & 1) as 0 | 1;
  }

  /** Read a single bit as a boolean. */
  bool(): boolean {
    return this.bit() === 1;
  }

  /** Read `count` bits (0–32) as an unsigned big-endian integer. */
  bits(count: number): number {
    if (!Number.isInteger(count) || count < 0 || count > 32) {
      throw new RangeError(`bits(count): count must be an integer in 0..32, got ${count}.`);
    }
    let value = 0;
    for (let i = 0; i < count; i += 1) {
      value = (value << 1) | this.bit();
    }
    return value >>> 0;
  }
}

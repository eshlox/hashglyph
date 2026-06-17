/**
 * Minimal ICO encoder. Wraps one or more PNG images in the classic `.ico`
 * container. PNG-in-ICO is supported by every modern browser/OS, so we store
 * the PNGs verbatim. Pure and isomorphic (Uint8Array in, Uint8Array out).
 */

/** A single PNG entry to embed in an ICO file. */
export interface IcoEntry {
  /** Square pixel size (1–256). 256 is encoded as the byte 0 per the spec. */
  readonly size: number;
  /** Raw PNG bytes. */
  readonly png: Uint8Array;
}

const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;

/** Encode PNG entries into a single `.ico` byte array. */
export function encodeIco(entries: readonly IcoEntry[]): Uint8Array {
  if (entries.length === 0) {
    throw new RangeError('encodeIco: at least one entry is required.');
  }
  for (const { size } of entries) {
    if (!Number.isInteger(size) || size < 1 || size > 256) {
      throw new RangeError(`encodeIco: entry size must be an integer 1..256, got ${size}.`);
    }
  }

  const directorySize = HEADER_SIZE + entries.length * ENTRY_SIZE;
  const totalSize = directorySize + entries.reduce((sum, entry) => sum + entry.png.length, 0);

  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // ICONDIR header.
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = icon
  view.setUint16(4, entries.length, true); // image count

  let entryOffset = HEADER_SIZE;
  let imageOffset = directorySize;
  for (const { size, png } of entries) {
    const dim = size >= 256 ? 0 : size; // 256 → 0
    buffer[entryOffset] = dim; // width
    buffer[entryOffset + 1] = dim; // height
    buffer[entryOffset + 2] = 0; // color palette count
    buffer[entryOffset + 3] = 0; // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, png.length, true); // size of image data
    view.setUint32(entryOffset + 12, imageOffset, true); // offset of image data

    buffer.set(png, imageOffset);
    imageOffset += png.length;
    entryOffset += ENTRY_SIZE;
  }

  return buffer;
}

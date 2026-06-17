import { createZip, encodeIco } from '@eshlox/hashglyph-core';

/** Copy bytes into a standalone ArrayBuffer (a valid, strictly-typed BlobPart). */
function asBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * Load an SVG string as an HTMLImageElement. Using an `<img>` + object URL is
 * the most cross-browser way to rasterize SVG (Safari's `createImageBitmap`
 * support for SVG is patchy). The SVG must carry intrinsic width/height, ours
 * does. Self-contained SVG ⇒ the canvas is never tainted.
 */
function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG.'));
    };
    img.src = url;
  });
}

/** Rasterize an SVG to a PNG Blob at the given pixel dimensions (crisp). */
export async function svgToPngBlob(svg: string, width: number, height = width): Promise<Blob> {
  const img = await loadSvgImage(svg);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed.'))),
      'image/png',
    );
  });
}

/** Rasterize an SVG to PNG bytes. */
export async function svgToPngBytes(svg: string, size: number): Promise<Uint8Array> {
  const blob = await svgToPngBlob(svg, size);
  return new Uint8Array(await blob.arrayBuffer());
}

/** Build a multi-resolution `.ico` (16/32/48) Blob from an SVG. */
export async function svgToIcoBlob(svg: string): Promise<Blob> {
  const sizes = [16, 32, 48];
  const entries = await Promise.all(
    sizes.map(async (size) => ({ size, png: await svgToPngBytes(svg, size) })),
  );
  return new Blob([asBuffer(encodeIco(entries))], { type: 'image/x-icon' });
}

/** Bundle a full asset set (SVG + PNGs + ICO) into a single zip Blob. */
export async function buildAssetZip(svg: string, base: string): Promise<Blob> {
  const sizes = [16, 32, 48, 180, 192, 512, 1024];
  const files: Record<string, Uint8Array> = {
    [`${base}.svg`]: new TextEncoder().encode(svg),
  };
  for (const size of sizes) {
    files[`${base}-${size}.png`] = await svgToPngBytes(svg, size);
  }
  const icoEntries = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, png: await svgToPngBytes(svg, size) })),
  );
  files['favicon.ico'] = encodeIco(icoEntries);
  return new Blob([asBuffer(createZip(files))], { type: 'application/zip' });
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download a string as a UTF-8 text/SVG file. */
export function downloadText(text: string, filename: string, type = 'image/svg+xml'): void {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}

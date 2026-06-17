import sharp from 'sharp';

/**
 * Rasterize an SVG string to a square PNG buffer at `size`×`size`.
 *
 * Uses nearest-neighbour resizing so the pixel-art stays crisp, and strips all
 * metadata so output bytes are reproducible across runs/machines.
 */
export async function svgToPng(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { kernel: 'nearest', fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

/** Rasterize an SVG string to a PNG at explicit (possibly non-square) dimensions. */
export async function svgToPngSized(svg: string, width: number, height: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(width, height, { kernel: 'nearest', fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

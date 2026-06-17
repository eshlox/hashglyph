/** Parse a #rgb / #rrggbb hex color to [r,g,b] (0–255), or null if not hex. */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1] as string;
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const int = Number.parseInt(h, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors, or null if either isn't hex. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return null;
  const la = luminance(ca);
  const lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

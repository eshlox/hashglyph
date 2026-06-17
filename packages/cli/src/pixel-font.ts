/**
 * A tiny built-in 5×7 pixel font, rendered as SVG `<rect>`s.
 *
 * Why a hand-rolled font? The OG image must be a *frozen, reproducible* brand
 * asset — generating identical bytes on any machine. Relying on system fonts
 * (via librsvg/fontconfig) would make output depend on which fonts happen to be
 * installed. Drawing text as pixels removes that dependency entirely and suits
 * a pixel-glyph tool perfectly. Text is upper-cased for a clean terminal vibe.
 */

// Each glyph is 7 rows × 5 cols. '#' = on. Authored for legibility at scale.
const GLYPHS: Record<string, string[]> = {
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  F: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  G: [' ####', '#    ', '#    ', '#  ##', '#   #', '#   #', ' ####'],
  H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['  ###', '   # ', '   # ', '   # ', '#  # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '    #', '   # ', '  ## ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': [' ### ', '#    ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '    #', ' ### '],
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '     ', ' ##  ', ' ##  '],
  ',': ['     ', '     ', '     ', '     ', ' ##  ', ' ##  ', ' #   '],
  '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
  _: ['     ', '     ', '     ', '     ', '     ', '     ', '#####'],
  ':': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', ' ##  ', '     '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '"': [' # # ', ' # # ', ' # # ', '     ', '     ', '     ', '     '],
  "'": ['  #  ', '  #  ', '  #  ', '     ', '     ', '     ', '     '],
  '(': ['   # ', '  #  ', ' #   ', ' #   ', ' #   ', '  #  ', '   # '],
  ')': [' #   ', '  #  ', '   # ', '   # ', '   # ', '  #  ', ' #   '],
  '·': ['     ', '     ', '     ', ' ##  ', ' ##  ', '     ', '     '],
  '×': ['     ', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '     '],
};

const FALLBACK = GLYPHS[' '];
/** Cols a single character advances (5 glyph + 1 gap). */
export const CHAR_ADVANCE = 6;

/** Pixel width of `text` at scale `scale`. */
export function measureText(text: string, scale: number): number {
  return text.length * CHAR_ADVANCE * scale;
}

/**
 * Render `text` as SVG `<rect>` pixels starting at (x, y), upper-cased.
 * Returns only the rects; wrap them in a coloured `<g>` for output.
 */
export function textRects(text: string, x: number, y: number, scale: number): string {
  const rects: string[] = [];
  const upper = text.toUpperCase();
  let cursor = x;
  for (const char of upper) {
    const glyph = GLYPHS[char] ?? FALLBACK ?? [];
    for (let row = 0; row < glyph.length; row += 1) {
      const line = glyph[row];
      if (!line) continue;
      for (let col = 0; col < line.length; col += 1) {
        if (line[col] !== '#') continue;
        rects.push(
          `<rect x="${cursor + col * scale}" y="${y + row * scale}" width="${scale}" height="${scale}"/>`,
        );
      }
    }
    cursor += CHAR_ADVANCE * scale;
  }
  return rects.join('');
}

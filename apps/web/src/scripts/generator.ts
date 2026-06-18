import {
  type Glyph,
  generateGlyph,
  renderQrSvg,
  renderSvg,
  STYLES,
  type SvgOptions,
  tryNormalizeSeed,
} from '@eshlox/hashglyph-core';
import { contrastRatio } from '../lib/contrast.js';
import {
  buildAssetZip,
  downloadBlob,
  downloadText,
  svgToIcoBlob,
  svgToPngBlob,
} from '../lib/raster.js';
import {
  DEFAULT_STATE,
  type GlyphState,
  normalizeQrUrl,
  parseState,
  QR_URL_WARN_LENGTH,
  slugify,
  toQuery,
} from '../lib/state.js';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

/** Below this WCAG ratio a glyph reads as "washed out" at favicon sizes. */
const MIN_CONTRAST = 1.6;

/** Wire up the interactive generator. Called once on DOMContentLoaded. */
export function initGenerator(): void {
  const state: GlyphState = parseState(window.location.search);

  const controls = {
    seed: el<HTMLInputElement>('seed'),
    hash: el<HTMLSelectElement>('hash'),
    style: el<HTMLSelectElement>('style'),
    fg: el<HTMLInputElement>('fg'),
    bg: el<HTMLInputElement>('bg'),
    transparent: el<HTMLInputElement>('transparent'),
    rounded: el<HTMLInputElement>('rounded'),
    padding: el<HTMLInputElement>('padding'),
    qr: el<HTMLInputElement>('qr-toggle'),
    qrUrl: el<HTMLInputElement>('qr-url'),
    verifySeed: el<HTMLInputElement>('verify-seed'),
  };

  const view = {
    preview: el<HTMLDivElement>('preview'),
    digest: el<HTMLElement>('digest'),
    material: el<HTMLElement>('material'),
    verifyResult: el<HTMLElement>('verify-result'),
    permalink: el<HTMLInputElement>('permalink'),
    contrast: el<HTMLElement>('contrast-warning'),
    fgField: el<HTMLElement>('fg-field'),
    matrix: el<HTMLDivElement>('matrix'),
    qrPreview: el<HTMLDivElement>('qr-preview'),
    qrWrap: el<HTMLElement>('qr-section'),
    qrWarn: el<HTMLElement>('qr-warning'),
    seedError: el<HTMLElement>('seed-error'),
  };

  // Reflect initial state into the controls.
  controls.seed.value = state.seed;
  controls.hash.value = state.hash;
  controls.style.value = state.style;
  controls.fg.value = state.fg;
  controls.bg.value = state.bg;
  controls.transparent.checked = state.transparent;
  controls.rounded.checked = state.rounded;
  controls.padding.value = String(state.padding);
  controls.qr.checked = state.qrMode;
  controls.qrUrl.value = state.qrUrl;
  view.qrWrap.hidden = !state.qrMode;

  const svgOptions = (): SvgOptions => ({
    fg: state.fg,
    bg: state.transparent ? null : state.bg,
    pixel: state.rounded ? 'rounded' : 'square',
    padding: state.padding,
    scale: 48,
  });

  const stripProlog = (svg: string) => svg.replace(/^<\?xml[^>]*\?>\s*/, '');

  let current: { glyph: Glyph; svg: string } | null = null;

  function updatePermalink(): void {
    const query = toQuery(state);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', url);
    view.permalink.value = `${window.location.origin}${url}`;
  }

  // Pixel color only applies to the monochrome style; color-8 has a fixed palette.
  const isColorStyle = (): boolean => state.style === 'color-8';

  /**
   * Whether to warn about legibility. Mono compares ink vs background. Color-8
   * only lets the user change the background, so warn only when even the
   * best-contrasting palette color is washed out against it (not when any single
   * hue clashes — a 15-color mosaic always has some).
   */
  function lowContrast(glyph: Glyph): boolean {
    if (state.transparent) return false;
    if (!isColorStyle()) {
      const ratio = contrastRatio(state.fg, state.bg);
      return ratio !== null && ratio < MIN_CONTRAST;
    }
    const ratios = glyph.palette
      .filter((color): color is string => color !== null)
      .map((color) => contrastRatio(color, state.bg))
      .filter((ratio): ratio is number => ratio !== null);
    return ratios.length > 0 && Math.max(...ratios) < MIN_CONTRAST;
  }

  function render(): void {
    view.fgField.hidden = isColorStyle();
    const normalized = tryNormalizeSeed(state.seed);
    view.seedError.hidden = normalized !== null;
    if (normalized === null) {
      // Invalid seed: drop the stale glyph so previews/downloads don't point at
      // the previous one. Download handlers all guard on `current`.
      current = null;
      view.preview.replaceChildren();
      view.qrPreview.replaceChildren();
      view.digest.textContent = '…';
      view.material.textContent = '…';
      runVerify(); // clears the stale match/mismatch result (current is null)
      updatePermalink();
      return;
    }

    const glyph = generateGlyph({ seed: state.seed, hash: state.hash, style: state.style });
    const svg = renderSvg(glyph, svgOptions());
    current = { glyph, svg };

    view.preview.innerHTML = stripProlog(svg);
    view.digest.textContent = glyph.digestHex;
    view.material.textContent = glyph.material;

    updatePermalink();
    runVerify();

    // Contrast warning (only meaningful on a visible background).
    view.contrast.hidden = !lowContrast(glyph);

    renderMatrix();
    if (state.qrMode) renderQr();
  }

  function renderMatrix(): void {
    view.matrix.replaceChildren();
    for (const style of STYLES) {
      const g = generateGlyph({ seed: state.seed, hash: state.hash, style: style.id });
      const swatch = renderSvg(g, { fg: '#0b0e14', bg: '#ffffff', padding: 1, scale: 16 });
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `matrix-cell${style.id === state.style ? ' is-active' : ''}`;
      button.title = `${style.label}: ${style.description}`;
      button.setAttribute('aria-pressed', String(style.id === state.style));
      button.innerHTML = `<span class="matrix-art">${stripProlog(swatch)}</span><span class="matrix-label">${style.label}</span>`;
      button.addEventListener('click', () => {
        state.style = style.id;
        controls.style.value = style.id;
        render();
      });
      view.matrix.append(button);
    }
  }

  /** Prove the displayed glyph really belongs to a name the visitor types. */
  function runVerify(): void {
    const probe = controls.verifySeed.value;
    if (!current || tryNormalizeSeed(probe) === null) {
      view.verifyResult.textContent = '';
      view.verifyResult.dataset.state = '';
      return;
    }
    const match =
      generateGlyph({ seed: probe, hash: state.hash, style: state.style }).digestHex ===
      current.glyph.digestHex;
    view.verifyResult.textContent = match ? '✓ matches this glyph' : '✗ different glyph';
    view.verifyResult.dataset.state = match ? 'ok' : 'bad';
  }

  function renderQr(): void {
    if (!current) return;
    const target = normalizeQrUrl(state.qrUrl);
    const qrSvg = renderQrSvg(target, current.glyph, { glyphCoverage: 0.24 });
    view.qrPreview.innerHTML = stripProlog(qrSvg);
    view.qrWarn.hidden = target.length <= QR_URL_WARN_LENGTH;
  }

  // --- Control wiring -------------------------------------------------------
  controls.seed.addEventListener('input', () => {
    state.seed = controls.seed.value.slice(0, 64) || DEFAULT_STATE.seed;
    render();
  });
  controls.hash.addEventListener('change', () => {
    state.hash = controls.hash.value as GlyphState['hash'];
    render();
  });
  controls.style.addEventListener('change', () => {
    state.style = controls.style.value as GlyphState['style'];
    render();
  });
  controls.verifySeed.addEventListener('input', runVerify);
  controls.fg.addEventListener('input', () => {
    state.fg = controls.fg.value;
    render();
  });
  controls.bg.addEventListener('input', () => {
    state.bg = controls.bg.value;
    render();
  });
  controls.transparent.addEventListener('change', () => {
    state.transparent = controls.transparent.checked;
    render();
  });
  controls.rounded.addEventListener('change', () => {
    state.rounded = controls.rounded.checked;
    render();
  });
  controls.padding.addEventListener('input', () => {
    state.padding = Number(controls.padding.value);
    render();
  });
  controls.qr.addEventListener('change', () => {
    state.qrMode = controls.qr.checked;
    view.qrWrap.hidden = !state.qrMode;
    render();
  });
  controls.qrUrl.addEventListener('input', () => {
    state.qrUrl = controls.qrUrl.value;
    if (state.qrMode) renderQr();
    updatePermalink();
  });

  // --- Actions --------------------------------------------------------------
  const base = () => slugify(current?.glyph.normalized ?? 'glyph');

  const flash = (button: HTMLButtonElement, text: string) => {
    const original = button.dataset.label ?? button.textContent ?? '';
    button.dataset.label = original;
    button.textContent = text;
    setTimeout(() => {
      button.textContent = button.dataset.label ?? original;
    }, 1200);
  };

  el<HTMLButtonElement>('copy-svg').addEventListener('click', async (e) => {
    if (!current) return;
    await navigator.clipboard.writeText(current.svg);
    flash(e.currentTarget as HTMLButtonElement, 'Copied!');
  });
  el<HTMLButtonElement>('copy-link').addEventListener('click', async (e) => {
    await navigator.clipboard.writeText(view.permalink.value);
    flash(e.currentTarget as HTMLButtonElement, 'Copied!');
  });
  el<HTMLButtonElement>('dl-svg').addEventListener('click', () => {
    if (current) downloadText(current.svg, `${base()}.svg`);
  });
  el<HTMLButtonElement>('dl-png').addEventListener('click', async () => {
    if (!current) return;
    const size = Number(el<HTMLSelectElement>('png-size').value);
    downloadBlob(await svgToPngBlob(current.svg, size), `${base()}-${size}.png`);
  });
  el<HTMLButtonElement>('dl-ico').addEventListener('click', async () => {
    if (current) downloadBlob(await svgToIcoBlob(current.svg), 'favicon.ico');
  });
  el<HTMLButtonElement>('dl-zip').addEventListener('click', async (e) => {
    if (!current) return;
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true;
    try {
      downloadBlob(await buildAssetZip(current.svg, base()), `${base()}-hashglyph.zip`);
    } finally {
      button.disabled = false;
    }
  });
  el<HTMLButtonElement>('dl-qr').addEventListener('click', async () => {
    if (!current) return;
    const qrSvg = renderQrSvg(normalizeQrUrl(state.qrUrl), current.glyph, { glyphCoverage: 0.24 });
    downloadBlob(await svgToPngBlob(qrSvg, 1024), `${base()}-qr.png`);
  });
  el<HTMLButtonElement>('randomize').addEventListener('click', () => {
    const words = [
      'hashglyph',
      'nebula',
      'cipher',
      'quanta',
      'zenith',
      'orbit',
      'vertex',
      'photon',
    ];
    state.seed = words[Math.floor(Math.random() * words.length)] ?? 'hashglyph';
    controls.seed.value = state.seed;
    render();
  });

  render();
}

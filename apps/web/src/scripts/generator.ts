import {
  type Glyph,
  GRAMMARS,
  generateGlyph,
  renderQrSvg,
  renderSvg,
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
import { DEFAULT_STATE, type GlyphState, parseState, slugify, toQuery } from '../lib/state.js';

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

const QR_URL = 'https://hashglyph.eshlox.net';

/** Wire up the interactive generator. Called once on DOMContentLoaded. */
export function initGenerator(): void {
  const state: GlyphState = parseState(window.location.search);

  const controls = {
    seed: el<HTMLInputElement>('seed'),
    hash: el<HTMLSelectElement>('hash'),
    grammar: el<HTMLSelectElement>('grammar'),
    fg: el<HTMLInputElement>('fg'),
    bg: el<HTMLInputElement>('bg'),
    transparent: el<HTMLInputElement>('transparent'),
    rounded: el<HTMLInputElement>('rounded'),
    padding: el<HTMLInputElement>('padding'),
    qr: el<HTMLInputElement>('qr-toggle'),
  };

  const view = {
    preview: el<HTMLDivElement>('preview'),
    digest: el<HTMLElement>('digest'),
    material: el<HTMLElement>('material'),
    permalink: el<HTMLInputElement>('permalink'),
    contrast: el<HTMLElement>('contrast-warning'),
    matrix: el<HTMLDivElement>('matrix'),
    qrPreview: el<HTMLDivElement>('qr-preview'),
    qrWrap: el<HTMLElement>('qr-section'),
    seedError: el<HTMLElement>('seed-error'),
  };

  // Reflect initial state into the controls.
  controls.seed.value = state.seed;
  controls.hash.value = state.hash;
  controls.grammar.value = state.grammar;
  controls.fg.value = state.fg;
  controls.bg.value = state.bg;
  controls.transparent.checked = state.transparent;
  controls.rounded.checked = state.rounded;
  controls.padding.value = String(state.padding);
  controls.qr.checked = false;

  const svgOptions = (): SvgOptions => ({
    fg: state.fg,
    bg: state.transparent ? null : state.bg,
    pixel: state.rounded ? 'rounded' : 'square',
    padding: state.padding,
    scale: 48,
  });

  const stripProlog = (svg: string) => svg.replace(/^<\?xml[^>]*\?>\s*/, '');

  let current: { glyph: Glyph; svg: string } | null = null;

  function render(): void {
    const normalized = tryNormalizeSeed(state.seed);
    view.seedError.hidden = normalized !== null;
    if (normalized === null) return;

    const glyph = generateGlyph({ seed: state.seed, hash: state.hash, grammar: state.grammar });
    const svg = renderSvg(glyph, svgOptions());
    current = { glyph, svg };

    view.preview.innerHTML = stripProlog(svg);
    view.digest.textContent = glyph.digestHex;
    view.material.textContent = glyph.material;

    // Permalink.
    const query = toQuery(state);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', url);
    view.permalink.value = `${window.location.origin}${url}`;

    // Contrast warning (only meaningful for hex on a visible background).
    const ratio = state.transparent ? null : contrastRatio(state.fg, state.bg);
    view.contrast.hidden = !(ratio !== null && ratio < 1.6);

    renderMatrix();
    if (controls.qr.checked) renderQr();
  }

  function renderMatrix(): void {
    view.matrix.replaceChildren();
    for (const grammar of GRAMMARS) {
      const g = generateGlyph({ seed: state.seed, hash: state.hash, grammar: grammar.id });
      const swatch = renderSvg(g, { fg: '#0b0e14', bg: '#ffffff', padding: 1, scale: 16 });
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `matrix-cell${grammar.id === state.grammar ? ' is-active' : ''}`;
      button.title = `${grammar.label} — ${grammar.description}`;
      button.setAttribute('aria-pressed', String(grammar.id === state.grammar));
      button.innerHTML = `<span class="matrix-art">${stripProlog(swatch)}</span><span class="matrix-label">${grammar.label}</span>`;
      button.addEventListener('click', () => {
        state.grammar = grammar.id;
        controls.grammar.value = grammar.id;
        render();
      });
      view.matrix.append(button);
    }
  }

  function renderQr(): void {
    if (!current) return;
    const qrSvg = renderQrSvg(QR_URL, current.glyph, { glyphCoverage: 0.24 });
    view.qrPreview.innerHTML = stripProlog(qrSvg);
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
  controls.grammar.addEventListener('change', () => {
    state.grammar = controls.grammar.value as GlyphState['grammar'];
    render();
  });
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
    view.qrWrap.hidden = !controls.qr.checked;
    if (controls.qr.checked) renderQr();
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
    const qrSvg = renderQrSvg(QR_URL, current.glyph, { glyphCoverage: 0.24 });
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

/**
 * Generates public/assets/og-card.png (1200×630) for Open Graph / Twitter Card.
 * Run once: node scripts/generate-og.mjs
 * Requires satori + @resvg/resvg-js devDeps.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Google Fonts returns TTF when given this legacy Android UA
const FONT_UA = 'Mozilla/5.0 (Linux; Android 2.2) AppleWebKit/533.1';

async function fetchGoogleFontTTF(family, weight) {
  const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}&subset=latin`;
  const css = await fetch(cssUrl, { headers: { 'User-Agent': FONT_UA } }).then(r => r.text());
  const match = css.match(/url\(([^)]+\.ttf)\)/);
  if (!match) throw new Error(`No TTF URL found in Google Fonts CSS for ${family}:${weight}`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`Font download failed: ${match[1]}`);
  return Buffer.from(await res.arrayBuffer());
}

const W = 1200;
const H = 630;

// Palette from src/styles/global.css
const BG   = '#f1ece0';
const INK  = '#1c1a16';
const INK2 = '#3a362e';
const MUTED = '#6a6358';
const RULE  = '#d6cebd';
const ACCENT = '#4f6ef7';

async function main() {
  console.log('Fetching fonts from Google Fonts (TTF via legacy UA)…');
  const [serifRegular, sansSemiBold, monoRegular] = await Promise.all([
    fetchGoogleFontTTF('IBM Plex Serif', 400),
    fetchGoogleFontTTF('IBM Plex Sans', 600),
    fetchGoogleFontTTF('IBM Plex Mono', 400),
  ]);

  console.log('Loading owl mark…');
  const owlBytes = await readFile(join(root, 'public/assets/quorai_owl.png'));
  const owlBase64 = `data:image/png;base64,${owlBytes.toString('base64')}`;

  const node = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: W,
        height: H,
        backgroundColor: BG,
        padding: '60px 80px',
        fontFamily: '"IBM Plex Serif"',
        position: 'relative',
      },
      children: [
        // Top row: owl + site name
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: 18, marginBottom: 'auto' },
            children: [
              {
                type: 'img',
                props: { src: owlBase64, width: 52, height: 52, style: { objectFit: 'contain' } },
              },
              {
                type: 'span',
                props: {
                  style: { fontFamily: '"IBM Plex Sans"', fontWeight: 600, fontSize: 22, color: INK2, letterSpacing: 1 },
                  children: 'quorai',
                },
              },
            ],
          },
        },
        // Main title
        {
          type: 'div',
          props: {
            style: {
              fontSize: 80,
              fontWeight: 400,
              color: INK,
              lineHeight: 1.0,
              letterSpacing: -2,
              marginBottom: 20,
            },
            children: 'Quorai',
          },
        },
        // Accent rule
        {
          type: 'div',
          props: {
            style: {
              width: 64,
              height: 4,
              backgroundColor: ACCENT,
              marginBottom: 24,
              borderRadius: 2,
            },
            children: '',
          },
        },
        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"IBM Plex Sans"',
              fontWeight: 600,
              fontSize: 30,
              color: INK2,
              marginBottom: 18,
              letterSpacing: -0.5,
            },
            children: 'Multi-Agent AI Trading Sandbox',
          },
        },
        // Description line
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"IBM Plex Sans"',
              fontWeight: 600,
              fontSize: 18,
              color: MUTED,
              marginBottom: 'auto',
            },
            children: '25 LLM analysts · 6 schools of thought · LangGraph · Python · open source',
          },
        },
        // Bottom rule
        {
          type: 'div',
          props: {
            style: { width: '100%', height: 1, backgroundColor: RULE, marginBottom: 20 },
            children: '',
          },
        },
        // Footer line
        {
          type: 'div',
          props: {
            style: {
              fontFamily: '"IBM Plex Mono"',
              fontWeight: 400,
              fontSize: 15,
              color: MUTED,
              letterSpacing: 0.5,
            },
            children: 'quorai.github.io  ·  MIT License',
          },
        },
      ],
    },
  };

  console.log('Rendering SVG with satori…');
  const svg = await satori(node, {
    width: W,
    height: H,
    fonts: [
      { name: 'IBM Plex Serif', data: serifRegular, weight: 400, style: 'normal' },
      { name: 'IBM Plex Sans',  data: sansSemiBold, weight: 600, style: 'normal' },
      { name: 'IBM Plex Mono',  data: monoRegular,  weight: 400, style: 'normal' },
    ],
  });

  console.log('Converting SVG → PNG…');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: W } });
  const png = resvg.render().asPng();

  const outPath = join(root, 'public/assets/og-card.png');
  await writeFile(outPath, png);
  const kb = Math.round(png.length / 1024);
  console.log(`✓ Written to ${outPath} (${kb} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Génère les icônes PWA / iOS — fond noir plein écran, logo IF centré (~84 %).
 * iOS applique son masque arrondi : ne pas pré-appliquer de coins ni fond blanc.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const SOURCE = join(PUBLIC, 'icon-ios-source.svg');

/** Logo occupe ~84 % du canvas (safe zone iOS / maskable). */
const LOGO_RATIO = 0.84;

const SIZES = [
  { size: 1024, name: 'icon-ios-1024.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 512, name: 'maskable-icon-512x512.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 64, name: 'pwa-64x64.png' },
];

async function renderIcon(size) {
  const svg = readFileSync(SOURCE, 'utf-8');
  const logoSize = Math.max(1, Math.round(size * LOGO_RATIO));
  const offset = Math.round((size - logoSize) / 2);

  const logo = await sharp(Buffer.from(svg)).resize(logoSize, logoSize).png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: logo, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  for (const { size, name } of SIZES) {
    const buffer = await renderIcon(size);
    writeFileSync(join(PUBLIC, name), buffer);
    console.log(`✓ ${name} (${size}×${size}, logo ${Math.round(size * LOGO_RATIO)}px)`);
  }
  console.log('\nIcônes PWA régénérées (fond #000 plein écran).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

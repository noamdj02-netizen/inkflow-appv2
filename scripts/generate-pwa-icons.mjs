#!/usr/bin/env node
/**
 * Génère les icônes PWA optimisées pour iOS
 * - 1024x1024 (base)
 * - 20% padding interne
 * - Fond noir #000000
 * - PNG non transparent
 * - Tailles : 180, 192, 512
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 * Prérequis: npm install sharp
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const SOURCE = join(PUBLIC, 'icon-ios-source.svg');
const SIZES = [
  { size: 1024, name: 'icon-ios-1024.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 512, name: 'maskable-icon-512x512.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 64, name: 'pwa-64x64.png' },
];

async function main() {
  const svg = readFileSync(SOURCE, 'utf-8');

  for (const { size, name } of SIZES) {
    const buffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const outPath = join(PUBLIC, name);
    writeFileSync(outPath, buffer);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  console.log('\nIcônes générées avec succès.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

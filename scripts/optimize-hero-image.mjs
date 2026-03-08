#!/usr/bin/env node
/**
 * Convertit mockup-profil.png en .webp pour réduire le LCP.
 * Exécuter : node scripts/optimize-hero-image.mjs
 * Nécessite : npm install sharp
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = join(root, 'public/images/mockup-profil.png');
const output = join(root, 'public/images/mockup-profil.webp');

if (!existsSync(input)) {
  console.warn('[optimize-hero] mockup-profil.png introuvable, skip.');
  process.exit(0);
}

try {
  const sharp = (await import('sharp')).default;
  const buf = readFileSync(input);
  await sharp(buf)
    .webp({ quality: 85 })
    .toFile(output);
  console.log('[optimize-hero] mockup-profil.webp créé');
} catch (err) {
  if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('sharp')) {
    console.warn('[optimize-hero] sharp non installé, skip. npm install sharp');
  } else {
    console.error('[optimize-hero]', err.message);
  }
  process.exit(0);
}

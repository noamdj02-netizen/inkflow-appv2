#!/usr/bin/env node
/**
 * Retire le fond blanc du mockup hero Mockuuups → PNG + WebP transparents.
 * Source : public/images/hero-mockup-hand-iphone.png (copie du fichier Mockuuups)
 * Usage : node scripts/key-hero-mockup-transparent.mjs
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = join(root, 'public/images/hero-mockup-hand-iphone.png');
const outPng = join(root, 'public/images/hero-mockup-hand-iphone-transparent.png');
const outWebp = join(root, 'public/images/hero-mockup-hand-iphone-transparent.webp');
const THRESHOLD = 238;

const sharp = (await import('sharp')).default;

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const min = Math.min(r, g, b);
  if (min >= THRESHOLD) {
    data[i + 3] = 0;
  } else if (min >= THRESHOLD - 25) {
    const t = (min - (THRESHOLD - 25)) / 25;
    data[i + 3] = Math.round(data[i + 3] * (1 - t));
  }
}

const base = sharp(data, { raw: { width, height, channels } }).png();
await base.clone().toFile(outPng);
await base.clone().webp({ quality: 86, alphaQuality: 100 }).toFile(outWebp);
console.log('[key-hero-mockup] OK → transparent PNG + WebP');

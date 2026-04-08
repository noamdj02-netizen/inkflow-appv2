#!/usr/bin/env node
/**
 * Convertit les images hero (mockup-profil.png, login-hero.jpg) en .webp pour réduire le LCP.
 * Exécuter : node scripts/optimize-hero-image.mjs
 * Nécessite : npm install sharp
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const images = [
  { input: 'public/images/mockup-profil.png', output: 'public/images/mockup-profil.webp' },
  { input: 'public/images/login-hero.jpg', output: 'public/images/login-hero.webp' },
  { input: 'public/images/ravi-sharma-7KMzdNfIlQY-unsplash.jpg', output: 'public/images/client-hero.webp' },
];

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[optimize-hero] sharp non installé, skip. npm install sharp');
  process.exit(0);
}

for (const { input, output } of images) {
  const inputPath = join(root, input);
  const outputPath = join(root, output);
  if (!existsSync(inputPath)) continue;
  if (existsSync(outputPath)) {
    console.log(`[optimize-hero] ${output.split('/').pop()} déjà présent, skip.`);
    continue;
  }
  try {
    const buf = readFileSync(inputPath);
    await sharp(buf).webp({ quality: 82 }).toFile(outputPath);
    console.log(`[optimize-hero] ${output.split('/').pop()} créé`);
  } catch (err) {
    console.error(`[optimize-hero] Erreur sur ${input}:`, err.message);
  }
}

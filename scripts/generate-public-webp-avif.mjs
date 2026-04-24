/**
 * Génère .webp + .avif à côté des PNG/JPG dans /public (écrasement OK).
 * Usage: node scripts/generate-public-webp-avif.mjs
 */
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const EXTS = new Set(['.png', '.jpg', '.jpeg']);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      yield* walk(full);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (EXTS.has(ext)) yield full;
    }
  }
}

async function main() {
  let n = 0;
  for await (const filePath of walk(publicDir)) {
    const ext = path.extname(filePath).toLowerCase();
    const base = filePath.slice(0, -ext.length);
    const webpPath = `${base}.webp`;
    const avifPath = `${base}.avif`;
    const buf = await sharp(filePath).rotate().toBuffer();
    await Promise.all([
      sharp(buf).webp({ quality: 82 }).toFile(webpPath),
      sharp(buf).avif({ quality: 55 }).toFile(avifPath),
    ]);
    n += 1;
  }
  console.log(`[img] wrote webp+avif for ${n} source file(s) under public/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

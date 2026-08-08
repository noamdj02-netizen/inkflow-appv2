import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, '_logo_variants');
const ICON_SVG_PATH = path.join(ROOT, 'public', 'icon.svg');

const S = 1024;

function svgWithBgFill(svg, bgHex) {
  // Swap the background rect fill only (safe: repo icon.svg is simple).
  return svg.replace(/(<rect[^>]*fill=\")#[0-9a-fA-F]{3,8}(\")/m, `$1${bgHex}$2`);
}

function svgNoBg(svg) {
  // Remove the first rect (background).
  return svg.replace(/<rect[^>]*\/>\s*/m, '');
}

async function writePng(name, buffer) {
  await fs.writeFile(path.join(OUT_DIR, name), buffer);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const svg = await fs.readFile(ICON_SVG_PATH, 'utf8');

  // Base renders
  const dark = await sharp(Buffer.from(svg))
    .resize(S, S)
    .png()
    .toBuffer();
  await writePng('inkflow-logo-dark.png', dark);

  const lightSvg = svgWithBgFill(svg, '#ffffff').replaceAll('fill="#ffffff"', 'fill="#0a0a0a"');
  const light = await sharp(Buffer.from(lightSvg))
    .resize(S, S)
    .png()
    .toBuffer();
  await writePng('inkflow-logo-light.png', light);

  const transparentSvg = svgNoBg(svg);
  const transparent = await sharp(Buffer.from(transparentSvg))
    .resize(S, S)
    .png()
    .toBuffer();
  await writePng('inkflow-logo-transparent.png', transparent);

  const blueSvg = svgWithBgFill(svg, '#2563eb');
  const blue = await sharp(Buffer.from(blueSvg))
    .resize(S, S)
    .png()
    .toBuffer();
  await writePng('inkflow-logo-blue.png', blue);

  // Circle badge variant: logo mark centered on a circle background.
  const mark = await sharp(Buffer.from(transparentSvg))
    .resize(720, 720)
    .png()
    .toBuffer();

  const circleBg = sharp({
    create: { width: S, height: S, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
  });

  const circleMaskSvg = Buffer.from(
    `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="white"/></svg>`
  );

  const circle = await circleBg
    .composite([{ input: mark, left: Math.round((S - 720) / 2), top: Math.round((S - 720) / 2) }])
    .png()
    .toBuffer();

  const circled = await sharp(circle)
    .composite([{ input: circleMaskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await writePng('inkflow-logo-circle.png', circled);

  // Manifest
  const files = await fs.readdir(OUT_DIR);
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ files }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


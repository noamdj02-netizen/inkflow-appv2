/**
 * Embed l'image hero-rdv.png en base64 dans la fonction send-booking-confirmation.
 * L'image est incluse directement dans l'email → s'affiche même si les images externes sont bloquées.
 * Optimisation : 600px, qualité 65% → email plus léger = envoi plus rapide.
 *
 * Usage: node scripts/embed-email-hero.mjs
 * À exécuter avant chaque déploiement de send-booking-confirmation si l'image change.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const imagePath = join(root, 'public', 'emails', 'hero-rdv.png');
const outputPath = join(root, 'supabase', 'functions', '_shared', 'heroImageBase64.ts');

const EMAIL_WIDTH = 600;
const QUALITY = 65;

try {
  const buffer = await sharp(imagePath)
    .resize(EMAIL_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: QUALITY })
    .toBuffer();
  const base64 = buffer.toString('base64');
  const content = `/**
 * Image hero RDV — générée par: node scripts/embed-email-hero.mjs
 * Ne pas éditer manuellement. Réexécuter le script si hero-rdv.png change.
 * Format: JPEG 600px, qualité 65% (léger pour envoi rapide)
 */
export const HERO_RDV_BASE64 = ${JSON.stringify(base64)};
export const HERO_RDV_MIME = "image/jpeg";
`;
  writeFileSync(outputPath, content);
  console.log('✓ hero-rdv.png embarquée dans supabase/functions/_shared/heroImageBase64.ts');
} catch (err) {
  console.error('Erreur:', err.message);
  if (err.code === 'ENOENT') {
    console.error('  → Vérifier que public/emails/hero-rdv.png existe.');
  }
  process.exit(1);
}

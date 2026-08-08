/**
 * Visuels démo espace client — uniquement des photos de tatouage (peau / séance / machine).
 * Les anciennes URLs Unsplash mélangaient portraits, mains, accessoires : incohérent pour l’app.
 *
 * Unsplash : hotlink autorisé avec paramètres de format (voir unsplash.com/license).
 */

const UNSPLASH_Q = 'auto=format&fit=crop&w=640&q=82&ixlib=rb-4.0.3';

/** Construit une URL Unsplash stable et recadrée. `id` = segment après / (ex. photo-1590247814433-af29651438a0) */
export function tattooDemoUrl(photoPath: string): string {
  const path = photoPath.startsWith('photo-') ? photoPath : `photo-${photoPath}`;
  return `https://images.unsplash.com/${path}?${UNSPLASH_Q}`;
}

/** Banque réutilisable (styles variés, toutes « tattoo » sur peau ou en séance) */
export const TATTOO_DEMO_PHOTOS = {
  sleeveBlack: 'photo-1590247814433-af29651438a0',
  backPiece: 'photo-1620122832021-0826f4967b36',
  artistTable: 'photo-1598371832090-4d0f0e7676dc',
  sessionClose: 'photo-1611501275019-9b5cda994e8d',
  machineDetail: 'photo-1565058375862-7170db0afd1f',
  armPortrait: 'photo-1575423446923-1e72b9a14cee',
  geometricSkin: 'photo-1621115318524-7ebaa6e932a2',
  roseArm: 'photo-1590247728525-3c5d56e20b81',
  greySleeve: 'photo-1604579275269-4e5cf4392250',
  fineLines: 'photo-1621605811361-8ca9166024f4',
  studioSession: 'photo-1525548111193-e1cf0a4b52b5',
  upperBodyInk: 'photo-1503341504253-dff4815485f1',
} as const;

const u = (key: keyof typeof TATTOO_DEMO_PHOTOS) => tattooDemoUrl(TATTOO_DEMO_PHOTOS[key]);

/** Portfolios fallback Rouen — 3 visuels tatouage par studio */
export const CLIENT_DEMO_STUDIO_PORTFOLIOS: Record<string, string[]> = {
  'thomas-leblanc-blackwork': [u('sleeveBlack'), u('geometricSkin'), u('greySleeve')],
  'lea-moreau-fineline': [u('fineLines'), u('roseArm'), u('sessionClose')],
  'hugo-martin-japonais': [u('backPiece'), u('armPortrait'), u('studioSession')],
  'sarah-dupont-realiste': [u('upperBodyInk'), u('studioSession'), u('sleeveBlack')],
};

/** Flash démo — une image tatouage par entrée */
export const CLIENT_DEMO_FLASH_IMAGES: Record<string, string> = {
  rf1: u('geometricSkin'),
  rf2: u('fineLines'),
  rf3: u('backPiece'),
  rf4: u('upperBodyInk'),
  rf5: u('sleeveBlack'),
  rf6: u('roseArm'),
};

/** Fil « communauté » (mock) — mêmes standards visuels */
export const CLIENT_DEMO_FEED_IMAGES = [
  u('fineLines'),
  u('backPiece'),
  u('geometricSkin'),
  u('greySleeve'),
] as const;

/**
 * Extrait un Place ID Google depuis du texte collé (ID brut ou URL Maps).
 * Les URL /place/Nom/.../data=... peuvent contenir !1sChIJ… ou %211sChIJ… (encodé).
 */

/** IDs Google Maps / Places (souvent ChIJ…) */
const PLACE_ID_LIKE = /^[A-Za-z0-9_-]{12,200}$/;

const CHIJ_IN_TEXT = /(ChIJ[A-Za-z0-9_-]{10,200})/g;

export function looksLikeShortMapsShareLink(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t.includes('share.google/') || t.includes('maps.app.goo.gl') || t.includes('goo.gl/maps');
}

/**
 * Nettoie un collage utilisateur : retours ligne, texte autour du lien, guillemets, espaces insécables.
 * Extrait le premier `https://…` si la ligne mélange texte + URL.
 */
export function normalizeMapsPasteInput(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  const urlMatch = s.match(/https?:\/\/[^\s<>"'[\]()]+/i);
  if (urlMatch) {
    s = urlMatch[0].replace(/[.,);'"\]]+$/u, '').trim();
  }
  s = s
    .replace(/\r?\n/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  s = s.replace(/^[<"'\u005b(]+|[>")\]',.;:]+$/u, '').trim();
  return s;
}

function tryDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Décodage URL successif (double / triple encodage parfois dans la barre d’adresse). */
function deepDecode(s: string): string {
  let prev = s;
  for (let i = 0; i < 5; i++) {
    const next = tryDecode(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function extractChIJFromString(s: string): string | null {
  const matches = s.matchAll(CHIJ_IN_TEXT);
  let best: string | null = null;
  for (const m of matches) {
    const id = m[1];
    if (PLACE_ID_LIKE.test(id) && (!best || id.length >= best.length)) best = id;
  }
  return best;
}

/** Variantes utiles (encodage partiel dans la barre d’adresse) */
function inputVariants(raw: string): string[] {
  const s = raw.trim();
  const out: string[] = [s, deepDecode(s)];
  const bang = s.replace(/%21/gi, '!').replace(/%26/gi, '&');
  if (bang !== s) out.push(bang, deepDecode(bang));
  return [...new Set(out.filter(Boolean))];
}

/** Un bloc `data=…` : plusieurs motifs !1s dans les URLs Maps récentes */
function placeIdFromDataChunk(part: string): string | null {
  let p = part;
  try {
    p = decodeURIComponent(part);
  } catch {
    /* garde brut */
  }
  try {
    p = decodeURIComponent(p);
  } catch {
    /* une passe suffit */
  }
  const patterns = [
    /!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!2s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!3m[0-9]+![^!]*!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!4m[0-9]+![^!]*!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
  ];
  for (const re of patterns) {
    const chij = p.match(re);
    if (chij?.[1] && PLACE_ID_LIKE.test(chij[1])) return chij[1];
  }
  return null;
}

/** Segment data=… (premier) — compat ancien code */
function extractFromDataSegment(s: string): string | null {
  const m = s.match(/(?:^|[?&/])data=([^?#]+)/);
  if (!m?.[1]) return null;
  return placeIdFromDataChunk(m[1]);
}

/** Tous les segments data=… (plusieurs blocs dans certaines URL longues) */
function extractFromAllDataSegments(s: string): string | null {
  const re = /(?:^|[?&/])data=([^?&#]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const id = placeIdFromDataChunk(m[1]);
    if (id) return id;
  }
  return null;
}

/**
 * Retourne le Place ID si trouvé, sinon null.
 */
export function parsePlaceIdFromPaste(raw: string): string | null {
  if (!raw.trim()) return null;

  const bases = [...new Set([raw.trim(), normalizeMapsPasteInput(raw)])];

  for (const base of bases) {
    if (!base) continue;
    for (const v of inputVariants(base)) {
      const fromAllData = extractFromAllDataSegments(v);
      if (fromAllData) return fromAllData;

      const fromData = extractFromDataSegment(v);
      if (fromData) return fromData;

      const inner = parsePlaceIdFromPasteInner(v);
      if (inner) return inner;
    }
  }

  const n = normalizeMapsPasteInput(raw);
  const brute = extractChIJFromString(n);
  if (brute) return brute;

  return null;
}

function parsePlaceIdFromPasteInner(s: string): string | null {
  const compact = s.replace(/\s+/g, '');

  if (!s.includes('://') && !s.includes('/') && !s.includes(' ')) {
    if (PLACE_ID_LIKE.test(s)) return s;
    return null;
  }

  try {
    const u = new URL(s);
    const q1 = u.searchParams.get('query_place_id');
    if (q1 && PLACE_ID_LIKE.test(q1)) return q1;
    const q2 = u.searchParams.get('place_id');
    if (q2 && PLACE_ID_LIKE.test(q2)) return q2;
    const qp = u.searchParams.get('q');
    if (qp?.startsWith('place_id:')) {
      const id = qp.slice('place_id:'.length).trim();
      if (PLACE_ID_LIKE.test(id)) return id;
    }
    const cid = u.searchParams.get('cid');
    if (cid && /^[0-9]+$/.test(cid)) {
      /* cid seul ≠ place_id — laissé au fetch Edge */
    }
  } catch {
    /* URL invalide — regex sur la chaîne */
  }

  const fromParam = compact.match(/(?:[?&])(?:query_)?place_id=([A-Za-z0-9_-]{12,200})/i);
  if (fromParam?.[1] && PLACE_ID_LIKE.test(fromParam[1])) return fromParam[1];

  const placesSlash = s.match(/places\/([A-Za-z0-9_-]{12,200})(?:\/|[?#]|$)/i);
  if (placesSlash?.[1] && PLACE_ID_LIKE.test(placesSlash[1])) return placesSlash[1];

  const placePathChij = s.match(/\/place\/(ChIJ[A-Za-z0-9_-]{10,200})(?:\/|[@?#]|$)/i);
  if (placePathChij?.[1] && PLACE_ID_LIKE.test(placePathChij[1])) return placePathChij[1];

  const data1s = s.match(/!1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (data1s?.[1] && PLACE_ID_LIKE.test(data1s[1])) return data1s[1];

  const amp1s = s.match(/[&!]1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (amp1s?.[1] && PLACE_ID_LIKE.test(amp1s[1])) return amp1s[1];

  return extractChIJFromString(s);
}

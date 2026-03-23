/**
 * Extrait un Place ID Google depuis du texte collé (ID brut ou URL Maps).
 * Les URL /place/Nom/.../data=... peuvent contenir !1sChIJ… ou %211sChIJ… (encodé).
 */

/** IDs Google Maps / Places (souvent ChIJ…) */
const PLACE_ID_LIKE = /^[A-Za-z0-9_-]{12,200}$/;

const CHIJ_IN_TEXT = /(ChIJ[A-Za-z0-9_-]{10,200})/;

export function looksLikeShortMapsShareLink(s: string): boolean {
  const t = s.trim().toLowerCase();
  return (
    t.includes('share.google/') ||
    t.includes('maps.app.goo.gl') ||
    t.includes('goo.gl/maps')
  );
}

function tryDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function extractChIJFromString(s: string): string | null {
  const m = s.match(CHIJ_IN_TEXT);
  if (!m?.[1]) return null;
  const id = m[1];
  return PLACE_ID_LIKE.test(id) ? id : null;
}

/** Variantes utiles (encodage partiel dans la barre d’adresse) */
function inputVariants(raw: string): string[] {
  const s = raw.trim();
  const out: string[] = [s];
  const dec = tryDecode(s);
  if (dec !== s) out.push(dec);
  const bang = s.replace(/%21/gi, '!').replace(/%26/gi, '&');
  if (bang !== s) out.push(bang);
  const bangDec = tryDecode(bang);
  if (bangDec !== bang && bangDec !== s && bangDec !== dec) out.push(bangDec);
  return [...new Set(out)];
}

/** Segment data=… des URL Maps (souvent !1sChIJ… ou !1s0x…:0x…) */
function extractFromDataSegment(s: string): string | null {
  const m = s.match(/(?:^|[?&/])data=([^?#]+)/);
  if (!m?.[1]) return null;
  let part = m[1];
  try {
    part = decodeURIComponent(part);
  } catch {
    /* garde brut */
  }
  const chij = part.match(/!1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (chij?.[1] && PLACE_ID_LIKE.test(chij[1])) return chij[1];
  return null;
}

/**
 * Retourne le Place ID si trouvé, sinon null.
 */
export function parsePlaceIdFromPaste(raw: string): string | null {
  if (!raw.trim()) return null;

  for (const v of inputVariants(raw)) {
    const fromData = extractFromDataSegment(v);
    if (fromData) return fromData;

    const inner = parsePlaceIdFromPasteInner(v);
    if (inner) return inner;
  }
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
  } catch {
    /* URL invalide — regex sur la chaîne */
  }

  const fromParam = compact.match(/(?:[?&])(?:query_)?place_id=([A-Za-z0-9_-]{12,200})/i);
  if (fromParam?.[1] && PLACE_ID_LIKE.test(fromParam[1])) return fromParam[1];

  const placesSlash = s.match(/places\/([A-Za-z0-9_-]{12,200})(?:\/|[?#]|$)/i);
  if (placesSlash?.[1] && PLACE_ID_LIKE.test(placesSlash[1])) return placesSlash[1];

  const data1s = s.match(/!1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (data1s?.[1] && PLACE_ID_LIKE.test(data1s[1])) return data1s[1];

  const amp1s = s.match(/&1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (amp1s?.[1] && PLACE_ID_LIKE.test(amp1s[1])) return amp1s[1];

  return extractChIJFromString(s);
}

/**
 * Extrait un Place ID Google depuis du texte collé (ID brut ou URL Maps).
 * Les liens courts (share.google, goo.gl) ne contiennent pas le Place ID — à ouvrir dans le navigateur.
 */

const PLACE_ID_LIKE = /^[A-Za-z0-9_-]{12,120}$/;

export function looksLikeShortMapsShareLink(s: string): boolean {
  const t = s.trim().toLowerCase();
  return (
    t.includes('share.google/') ||
    t.includes('maps.app.goo.gl') ||
    t.includes('goo.gl/maps')
  );
}

/**
 * Retourne le Place ID si trouvé, sinon null.
 */
export function parsePlaceIdFromPaste(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

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
    /* pas une URL valide */
  }

  const fromParam = s.match(/(?:[?&])(?:query_)?place_id=([A-Za-z0-9_-]{12,120})/i);
  if (fromParam) return fromParam[1];

  const placesSlash = s.match(/places\/([A-Za-z0-9_-]{12,120})/i);
  if (placesSlash) return placesSlash[1];

  return null;
}

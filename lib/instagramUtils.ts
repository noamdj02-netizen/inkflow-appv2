/**
 * Extrait un pseudo Instagram depuis un champ dédié ou une ligne "Instagram : @user" dans la description.
 */
export function parseInstagramHandle(
  direct: string | undefined | null,
  description?: string | undefined | null
): string | null {
  const clean = (s: string) => {
    let t = s.trim();
    if (t.startsWith('@')) t = t.slice(1);
    const m = t.match(/instagram\.com\/([^/?#]+)/i);
    if (m?.[1]) return m[1].replace(/^@/, '');
    return t.replace(/^@/, '').split(/[/?\s]/)[0] || '';
  };

  if (direct && direct.trim()) {
    const h = clean(direct);
    if (h && /^[\w.]+$/.test(h)) return h;
  }
  if (description) {
    const line = description.match(/instagram\s*:\s*@?([\w.]+)/i);
    if (line?.[1]) return line[1];
    const igLine = description.match(/@([\w.]+)\s*(\(|$|\n)/);
    if (igLine?.[1] && igLine[1].length >= 2) return igLine[1];
  }
  return null;
}

/** URL profil Instagram (ouvre l’app / le web). */
export function instagramProfileUrl(handle: string): string {
  const h = handle.replace(/^@/, '');
  return `https://www.instagram.com/${h}/`;
}

/** Lien court type ig.me pour ouvrir le profil / DM sur mobile. */
export function instagramMessageUrl(handle: string): string {
  const h = handle.replace(/^@/, '');
  return `https://ig.me/m/${h}`;
}

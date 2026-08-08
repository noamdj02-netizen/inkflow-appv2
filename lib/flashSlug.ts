/** Slug URL stable pour un flash (unique grâce au suffixe id). */
export function buildFlashSlug(title: string, flashId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const safeBase = base || 'flash';
  const suffix = flashId.replace(/[^a-z0-9]/gi, '').slice(-10) || flashId.slice(-8);
  return `${safeBase}-${suffix}`.toLowerCase();
}
